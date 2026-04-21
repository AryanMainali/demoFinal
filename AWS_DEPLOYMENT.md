# Kriterion — AWS Deployment Guide

## Architecture Overview

```
Internet
   │
   ▼
Route 53 (DNS)
   │
   ▼
ACM (SSL/TLS Certificate)
   │
   ▼
Application Load Balancer  (port 443 → HTTP)
   ├── /api/*   → Backend Target Group  (EC2 / ECS)
   └── /*       → Frontend Target Group (EC2 / ECS)
         │
         ├── EC2: Backend  (FastAPI + Celery worker + Celery beat)
         ├── EC2: Frontend (Next.js)
         ├── RDS: PostgreSQL 16
         ├── ElastiCache: Redis 7
         └── S3: File submissions + static assets
```

---

## Prerequisites

Install on your local machine:
```bash
brew install awscli          # AWS CLI v2
brew install --cask session-manager-plugin   # for SSM (no SSH key needed)
```

Configure your AWS credentials:
```bash
aws configure
# AWS Access Key ID:     <your key>
# AWS Secret Access Key: <your secret>
# Default region:        us-east-1
# Default output format: json
```

---

## Step 1 — Create an S3 Bucket for Submissions

```bash
# Replace kriterion-submissions-prod with a globally unique name
aws s3api create-bucket \
  --bucket kriterion-submissions-prod \
  --region us-east-1

# Block all public access
aws s3api put-public-access-block \
  --bucket kriterion-submissions-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning (protects submitted files)
aws s3api put-bucket-versioning \
  --bucket kriterion-submissions-prod \
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket kriterion-submissions-prod \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'
```

---

## Step 2 — Create an IAM Role for EC2

This lets the EC2 instance access S3 without hard-coding credentials.

```bash
# Create the trust policy file
cat > /tmp/ec2-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
EOF

# Create the role
aws iam create-role \
  --role-name KriterionEC2Role \
  --assume-role-policy-document file:///tmp/ec2-trust.json

# Attach S3 access (scoped to your bucket)
cat > /tmp/s3-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject","s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::kriterion-submissions-prod",
      "arn:aws:s3:::kriterion-submissions-prod/*"
    ]
  }]
}
EOF

aws iam put-role-policy \
  --role-name KriterionEC2Role \
  --policy-name KriterionS3Access \
  --policy-document file:///tmp/s3-policy.json

# Attach SSM policy (allows browser-based terminal access — no SSH key needed)
aws iam attach-role-policy \
  --role-name KriterionEC2Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

# Create the instance profile
aws iam create-instance-profile --instance-profile-name KriterionEC2Profile
aws iam add-role-to-instance-profile \
  --instance-profile-name KriterionEC2Profile \
  --role-name KriterionEC2Role
```

---

## Step 3 — Create the VPC and Security Groups

```bash
# Get your default VPC
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query "Vpcs[0].VpcId" --output text)
echo "VPC: $VPC_ID"

# ── ALB Security Group (public internet → port 80, 443) ──
ALB_SG=$(aws ec2 create-security-group \
  --group-name kriterion-alb-sg \
  --description "Kriterion ALB" \
  --vpc-id $VPC_ID \
  --query GroupId --output text)

aws ec2 authorize-security-group-ingress --group-id $ALB_SG \
  --protocol tcp --port 80  --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
echo "ALB SG: $ALB_SG"

# ── App Security Group (ALB → app, internal traffic) ──
APP_SG=$(aws ec2 create-security-group \
  --group-name kriterion-app-sg \
  --description "Kriterion App Servers" \
  --vpc-id $VPC_ID \
  --query GroupId --output text)

aws ec2 authorize-security-group-ingress --group-id $APP_SG \
  --protocol tcp --port 8000 --source-group $ALB_SG   # backend from ALB
aws ec2 authorize-security-group-ingress --group-id $APP_SG \
  --protocol tcp --port 3000 --source-group $ALB_SG   # frontend from ALB
aws ec2 authorize-security-group-ingress --group-id $APP_SG \
  --protocol tcp --port 8000 --source-group $APP_SG   # frontend → backend
echo "App SG: $APP_SG"

# ── DB Security Group (app → postgres 5432) ──
DB_SG=$(aws ec2 create-security-group \
  --group-name kriterion-db-sg \
  --description "Kriterion RDS" \
  --vpc-id $VPC_ID \
  --query GroupId --output text)

aws ec2 authorize-security-group-ingress --group-id $DB_SG \
  --protocol tcp --port 5432 --source-group $APP_SG
echo "DB SG: $DB_SG"

# ── Redis Security Group (app → redis 6379) ──
REDIS_SG=$(aws ec2 create-security-group \
  --group-name kriterion-redis-sg \
  --description "Kriterion Redis" \
  --vpc-id $VPC_ID \
  --query GroupId --output text)

aws ec2 authorize-security-group-ingress --group-id $REDIS_SG \
  --protocol tcp --port 6379 --source-group $APP_SG
echo "Redis SG: $REDIS_SG"
```

---

## Step 4 — Create RDS (PostgreSQL)

```bash
# Get subnet IDs from your default VPC
SUBNETS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "Subnets[*].SubnetId" --output text | tr '\t' ',')

# Create a DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name kriterion-db-subnets \
  --db-subnet-group-description "Kriterion DB subnets" \
  --subnet-ids $(echo $SUBNETS | tr ',' ' ')

# Create the RDS instance (db.t3.micro = free-tier eligible)
aws rds create-db-instance \
  --db-instance-identifier kriterion-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.3 \
  --master-username kriterion \
  --master-user-password "CHANGE_THIS_DB_PASSWORD" \
  --db-name kriterion \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --vpc-security-group-ids $DB_SG \
  --db-subnet-group-name kriterion-db-subnets \
  --no-publicly-accessible \
  --backup-retention-period 7 \
  --deletion-protection

# Wait ~10 minutes for it to become available
aws rds wait db-instance-available --db-instance-identifier kriterion-db

# Get the endpoint
DB_HOST=$(aws rds describe-db-instances \
  --db-instance-identifier kriterion-db \
  --query "DBInstances[0].Endpoint.Address" --output text)
echo "DB Host: $DB_HOST"
```

---

## Step 5 — Create ElastiCache (Redis)

```bash
# Create a Redis subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name kriterion-redis-subnets \
  --cache-subnet-group-description "Kriterion Redis subnets" \
  --subnet-ids $(echo $SUBNETS | tr ',' ' ')

# Create a single-node Redis cluster (cache.t3.micro = ~$12/month)
aws elasticache create-cache-cluster \
  --cache-cluster-id kriterion-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name kriterion-redis-subnets \
  --security-group-ids $REDIS_SG

# Wait ~5 minutes
aws elasticache wait cache-cluster-available --cache-cluster-id kriterion-redis

# Get the endpoint
REDIS_HOST=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id kriterion-redis --show-cache-node-info \
  --query "CacheClusters[0].CacheNodes[0].Endpoint.Address" --output text)
echo "Redis Host: $REDIS_HOST"
```

---

## Step 6 — Create the .env File for Production

Create this file locally — you will upload it to the EC2 instance in Step 8.

```bash
cat > .env.production << EOF
# ── App ──
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=$(openssl rand -hex 32)

# ── Database ──
DATABASE_URL=postgresql://kriterion:CHANGE_THIS_DB_PASSWORD@${DB_HOST}:5432/kriterion

# ── Redis / Celery ──
REDIS_URL=redis://${REDIS_HOST}:6379/0
CELERY_BROKER_URL=redis://${REDIS_HOST}:6379/0
CELERY_RESULT_BACKEND=redis://${REDIS_HOST}:6379/0

# ── S3 ──
USE_S3_STORAGE=true
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=kriterion-submissions-prod
# Leave these blank — the EC2 IAM role handles auth
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# ── CORS (replace with your real domain) ──
BACKEND_CORS_ORIGINS=["https://kriterion.vercel.app"]

# ── Frontend ──
NEXT_PUBLIC_API_URL=https://kriterion.yourdomain.com/api/v1
NEXT_PUBLIC_APP_NAME=Kriterion
EOF

echo "✅  .env.production created — review and fill in CHANGE_THIS_DB_PASSWORD"
```

---

## Step 7 — Launch the EC2 Instance

```bash
# Get the latest Amazon Linux 2023 AMI
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023*-x86_64" \
             "Name=state,Values=available" \
  --query "sort_by(Images, &CreationDate)[-1].ImageId" \
  --output text)
echo "AMI: $AMI_ID"

# Get the first subnet
SUBNET_ID=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "Subnets[0].SubnetId" --output text)

# Launch the instance (t3.medium: 2 vCPU, 4 GB RAM — good starting point)
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.medium \
  --subnet-id $SUBNET_ID \
  --security-group-ids $APP_SG \
  --iam-instance-profile Name=KriterionEC2Profile \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3","DeleteOnTermination":true}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=kriterion-app}]' \
  --query "Instances[0].InstanceId" --output text)

echo "Instance: $INSTANCE_ID"

# Wait for it to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get its private IP (used by the ALB)
PRIVATE_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query "Reservations[0].Instances[0].PrivateIpAddress" --output text)
echo "Private IP: $PRIVATE_IP"
```

---

## Step 8 — Install Docker and Deploy the App on EC2

Connect via SSM (no SSH key needed):
```bash
aws ssm start-session --target $INSTANCE_ID
```

Inside the EC2 session, run these commands:

```bash
# ── Install Docker ──
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Log out and back in for the group to take effect
exit
```

Reconnect, then continue:
```bash
aws ssm start-session --target $INSTANCE_ID
```

```bash
# ── Install Docker Compose ──
sudo curl -L \
  "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# ── Clone the repo ──
git clone https://github.com/YOUR_ORG/kriterion.git /home/ec2-user/kriterion
cd /home/ec2-user/kriterion

# ── Upload your .env.production ──
# (run this from your LOCAL machine in a separate terminal)
# aws ssm start-session ... or use scp / s3 cp
```

From your **local machine**, upload the env file:
```bash
# Option A — via S3 (safest, never touches disk in transit)
aws s3 cp .env.production s3://kriterion-submissions-prod/.env.production \
  --sse AES256

# On the EC2 instance, download it:
aws s3 cp s3://kriterion-submissions-prod/.env.production \
  /home/ec2-user/kriterion/.env
rm -f  # remove from S3 after copying
aws s3 rm s3://kriterion-submissions-prod/.env.production
```

Back on **EC2**, start the app:
```bash
cd /home/ec2-user/kriterion

# Use the production compose file
docker-compose -f docker-compose.prod.yml --env-file .env up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Seed the database (optional)
docker-compose -f docker-compose.prod.yml exec backend python scripts/seed_data.py

# Verify all containers are up
docker-compose -f docker-compose.prod.yml ps
```

---

## Step 9 — Set Up the Application Load Balancer

```bash
# Get all subnet IDs (ALB needs at least 2 AZs)
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "Subnets[*].SubnetId" --output text)

# Create the ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name kriterion-alb \
  --subnets $SUBNET_IDS \
  --security-groups $ALB_SG \
  --scheme internet-facing \
  --type application \
  --query "LoadBalancers[0].LoadBalancerArn" --output text)
echo "ALB ARN: $ALB_ARN"

# ── Backend Target Group (FastAPI on port 8000) ──
BACKEND_TG=$(aws elbv2 create-target-group \
  --name kriterion-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id $VPC_ID \
  --target-type instance \
  --health-check-path /api/v1/health \
  --health-check-interval-seconds 30 \
  --query "TargetGroups[0].TargetGroupArn" --output text)

# ── Frontend Target Group (Next.js on port 3000) ──
FRONTEND_TG=$(aws elbv2 create-target-group \
  --name kriterion-frontend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type instance \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --query "TargetGroups[0].TargetGroupArn" --output text)

# Register the EC2 instance with both target groups
aws elbv2 register-targets --target-group-arn $BACKEND_TG \
  --targets Id=$INSTANCE_ID,Port=8000
aws elbv2 register-targets --target-group-arn $FRONTEND_TG \
  --targets Id=$INSTANCE_ID,Port=3000

# ── HTTP Listener (redirects to HTTPS) ──
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions '[{
    "Type": "redirect",
    "RedirectConfig": {
      "Protocol": "HTTPS", "Port": "443",
      "StatusCode": "HTTP_301"
    }
  }]'

echo "Backend TG:  $BACKEND_TG"
echo "Frontend TG: $FRONTEND_TG"
echo "ALB ARN:     $ALB_ARN"

# Get the ALB DNS name (you'll need this for Route 53)
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].DNSName" --output text)
echo "ALB DNS: $ALB_DNS"
```

---

## Step 10 — Request an SSL Certificate (ACM)

```bash
# Request the certificate (replace with your real domain)
CERT_ARN=$(aws acm request-certificate \
  --domain-name kriterion.yourdomain.com \
  --validation-method DNS \
  --query CertificateArn --output text)
echo "Certificate ARN: $CERT_ARN"

# Get the CNAME record you need to add to your DNS
aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --query "Certificate.DomainValidationOptions[0].ResourceRecord"
```

Add the CNAME record shown above to your domain's DNS. Once validated (~5 min):

```bash
# ── HTTPS Listener with routing rules ──
HTTPS_LISTENER=$(aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
  --default-actions Type=forward,TargetGroupArn=$FRONTEND_TG \
  --query "Listeners[0].ListenerArn" --output text)

# Route /api/* and /docs to backend
aws elbv2 create-rule \
  --listener-arn $HTTPS_LISTENER \
  --priority 10 \
  --conditions '[{"Field":"path-pattern","Values":["/api/*","/docs","/openapi.json"]}]' \
  --actions Type=forward,TargetGroupArn=$BACKEND_TG
```

---

## Step 11 — Point Your Domain to the ALB (Route 53)

```bash
# Get your hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='yourdomain.com.'].Id" --output text | cut -d/ -f3)

# Get the ALB hosted zone ID
ALB_ZONE_ID=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].CanonicalHostedZoneId" --output text)

# Create the A record (alias to ALB)
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch "{
    \"Changes\": [{
      \"Action\": \"CREATE\",
      \"ResourceRecordSet\": {
        \"Name\": \"kriterion.yourdomain.com\",
        \"Type\": \"A\",
        \"AliasTarget\": {
          \"HostedZoneId\": \"$ALB_ZONE_ID\",
          \"DNSName\": \"$ALB_DNS\",
          \"EvaluateTargetHealth\": true
        }
      }
    }]
  }"
```

---

## Step 12 — Set Up Auto-Start on Reboot

On the EC2 instance (via SSM):
```bash
sudo tee /etc/systemd/system/kriterion.service << 'EOF'
[Unit]
Description=Kriterion Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/kriterion
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml --env-file .env up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=300
User=ec2-user

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable kriterion
```

---

## Useful Commands After Deployment

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f celery_worker

# Restart a service
docker-compose -f docker-compose.prod.yml restart backend

# Deploy a new version
cd /home/ec2-user/kriterion
git pull
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Check health
curl https://kriterion.yourdomain.com/api/v1/health

# Connect to the database
docker-compose -f docker-compose.prod.yml exec backend \
  python -c "from app.core.database import engine; print(engine.execute('SELECT 1').fetchone())"
```

---

## Estimated Monthly Cost (us-east-1)

| Service              | Size         | Est. Cost     |
|----------------------|--------------|---------------|
| EC2 t3.medium        | 1 instance   | ~$30/month    |
| RDS db.t3.micro      | PostgreSQL   | ~$15/month    |
| ElastiCache t3.micro | Redis        | ~$12/month    |
| ALB                  | ~1000 req/hr | ~$20/month    |
| S3                   | 10 GB        | ~$0.25/month  |
| Route 53             | 1 zone       | ~$0.50/month  |
| ACM                  | 1 cert       | **Free**      |
| **Total**            |              | **~$78/month**|

> 💡 **Save money:** Stop RDS and EC2 when not in use during development.
> ```bash
> aws rds stop-db-instance --db-instance-identifier kriterion-db
> aws ec2 stop-instances --instance-ids $INSTANCE_ID
> ```

---

## Troubleshooting

**Backend 502 Bad Gateway**
```bash
# Check the backend container is up
docker-compose -f docker-compose.prod.yml ps
# Check the ALB health checks
aws elbv2 describe-target-health --target-group-arn $BACKEND_TG
```

**Database connection refused**
```bash
# Verify the security group allows traffic from APP_SG → DB_SG on port 5432
# Check DATABASE_URL in .env matches the RDS endpoint exactly
```

**Celery tasks not running**
```bash
docker-compose -f docker-compose.prod.yml logs celery_worker
# Verify CELERY_BROKER_URL points to your ElastiCache Redis endpoint
```

**Migrations failed on startup**
```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker-compose -f docker-compose.prod.yml exec backend alembic current
```
