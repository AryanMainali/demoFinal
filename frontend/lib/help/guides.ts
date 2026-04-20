export type GuideRole = 'FACULTY' | 'STUDENT' | 'ASSISTANT' | 'ADMIN';

export interface GuideStep {
    title: string;
    detail: string;
}

export interface Guide {
    slug: string;
    title: string;
    description: string;
    category: string;
    roles: GuideRole[];
    iconName: string;
    steps: GuideStep[];
    tips?: string[];
    relatedSlugs?: string[];
    estimatedTime: string;
}

export const GUIDES: Guide[] = [
    // ─── FACULTY ───────────────────────────────────────────────────────────────
    {
        slug: 'create-course',
        title: 'Creating a Course',
        description: 'Set up a new course with a name, code, semester details, and optional enrollment settings.',
        category: 'Course Management',
        roles: ['FACULTY'],
        iconName: 'BookOpen',
        estimatedTime: '3 min',
        steps: [
            { title: 'Navigate to Courses', detail: 'Click "Courses" in the top navigation bar of your faculty dashboard.' },
            { title: 'Click "New Course"', detail: 'Press the "+ New Course" button in the top-right corner of the Courses page.' },
            { title: 'Fill in Course Details', detail: 'Enter the Course Name, Course Code (e.g. CS2000), Section, Semester, and Year. An optional description helps students understand what the course covers.' },
            { title: 'Set Course Status', detail: 'Choose "Active" to make the course immediately visible or "Draft" to keep it hidden until you\'re ready.' },
            { title: 'Save', detail: 'Click "Create Course". You\'ll be taken to the new course page where you can start adding assignments and enrolling students.' },
        ],
        tips: [
            'Use a consistent course code format (e.g. CSCI 3001-01) to avoid confusion.',
            'You can change the course status at any time from the course settings.',
            'Add a course color to make it easy to identify in dashboards.',
        ],
        relatedSlugs: ['enroll-students', 'create-assignment'],
    },
    {
        slug: 'create-assignment',
        title: 'Creating an Assignment',
        description: 'Build a coding assignment with test cases, rubric weights, deadlines, and publish settings.',
        category: 'Assignments',
        roles: ['FACULTY'],
        iconName: 'FileCode',
        estimatedTime: '5 min',
        steps: [
            { title: 'Open Your Course', detail: 'From the Courses page, click into the course you want to add an assignment to.' },
            { title: 'Go to Assignments', detail: 'Click the "Assignments" tab within the course page.' },
            { title: 'Click "+ New Assignment"', detail: 'Press the button in the top-right corner to open the assignment creation form.' },
            { title: 'Set Basic Info', detail: 'Enter a Title, choose the Programming Language, write a Description, and add step-by-step Instructions for students.' },
            { title: 'Configure Timing & Scoring', detail: 'Set the Start Date, Due Date, and an optional Grading Deadline for assistants. Enter Max Score and Passing Score.' },
            { title: 'Add Test Cases', detail: 'Click "+ Add Test Case" for each automated test. Set the Input, Expected Output, and point value. Mark tests as Hidden if students shouldn\'t see them.' },
            { title: 'Adjust Submission Settings', detail: 'Set max attempts (0 = unlimited), allowed file extensions, and late submission policy.' },
            { title: 'Publish', detail: 'Toggle "Publish assignment" on to release it immediately, or set a scheduled publish date. Click "Create Assignment".' },
        ],
        tips: [
            'Set Test Weight to 0% if you\'re using rubric-only grading.',
            'Hidden test cases prevent students from gaming specific outputs.',
            'Use the starter code field to give students a template to work from.',
            'Enable AI detection and plagiarism checks in the Integrity section.',
        ],
        relatedSlugs: ['setup-rubric', 'grade-submissions', 'publish-grades'],
    },
    {
        slug: 'grade-submissions',
        title: 'Grading Submissions',
        description: 'Review student submissions, run auto-grading, apply rubric scores, and leave feedback.',
        category: 'Grading',
        roles: ['FACULTY'],
        iconName: 'Target',
        estimatedTime: '4 min',
        steps: [
            { title: 'Open the Assignment', detail: 'Navigate to your course, click "Assignments", then click the assignment you want to grade.' },
            { title: 'Go to the Submissions Tab', detail: 'Click the "Submissions" tab on the assignment detail page to see all student submissions.' },
            { title: 'Run Auto-Grading (optional)', detail: 'Click "Autograde All" to run all test cases against every submission. Results appear in the Submissions list.' },
            { title: 'Click a Student\'s Submission', detail: 'Click "Grade" next to a student to open the grading workspace.' },
            { title: 'Review the Code', detail: 'Read the submitted code in the code viewer. Test case results are shown on the right.' },
            { title: 'Apply Rubric Scores', detail: 'Fill in rubric criterion scores in the Rubric panel. Each criterion shows its point value and description.' },
            { title: 'Leave Feedback', detail: 'Write general feedback in the Comments box. This is visible to the student after grades are published.' },
            { title: 'Save and Move On', detail: 'Click "Save Grade" to record the score. Use the navigation arrows to jump to the next student.' },
        ],
        tips: [
            'Use the Gradebook tab for a bird\'s-eye view of all scores.',
            'You can re-grade a submission at any time before publishing grades.',
            'Flag suspicious submissions from the plagiarism or AI detection tabs.',
        ],
        relatedSlugs: ['publish-grades', 'view-reports'],
    },
    {
        slug: 'enroll-students',
        title: 'Enrolling Students',
        description: 'Add individual students or bulk-import a roster via CSV into your course.',
        category: 'Course Management',
        roles: ['FACULTY'],
        iconName: 'Users',
        estimatedTime: '3 min',
        steps: [
            { title: 'Open Your Course', detail: 'Go to Courses and click the course you want to manage.' },
            { title: 'Go to the Students Tab', detail: 'Click "Students" in the course navigation tabs.' },
            { title: 'Enroll a Single Student', detail: 'Click "Enroll Student", type their email address, and confirm. They\'ll receive an invitation.' },
            { title: 'Bulk Enroll via CSV', detail: 'Click "Bulk Enroll", then download the CSV template. Fill in emails and student IDs, then upload the file.' },
            { title: 'Confirm the Import', detail: 'Review the preview of students to be enrolled. Click "Import" to complete the process.' },
        ],
        tips: [
            'Students must already have a Kriterion account to be enrolled.',
            'Bulk import is the fastest way to enroll a full class — use the template format exactly.',
            'Students can be removed from a course at any time from the Students tab.',
        ],
        relatedSlugs: ['create-course'],
    },
    {
        slug: 'publish-grades',
        title: 'Publishing Grades',
        description: 'Release assignment grades so students can see their scores and feedback.',
        category: 'Grading',
        roles: ['FACULTY'],
        iconName: 'CheckCircle2',
        estimatedTime: '2 min',
        steps: [
            { title: 'Open the Assignment', detail: 'Navigate to the assignment whose grades you want to publish.' },
            { title: 'Go to the Overview Tab', detail: 'The Overview tab shows the current publish status of grades.' },
            { title: 'Click "Publish Grades"', detail: 'Press the "Publish Grades" button. A confirmation prompt will appear.' },
            { title: 'Confirm', detail: 'Click "Publish" to confirm. Students will immediately be able to see their scores and feedback.' },
            { title: 'Hide Grades (if needed)', detail: 'To retract grades (e.g. to make corrections), click "Hide Grades". Grades become invisible to students until you re-publish.' },
        ],
        tips: [
            'Make sure all submissions are graded before publishing.',
            'Students receive a notification when grades are published.',
            'You can hide and republish grades as many times as needed.',
        ],
        relatedSlugs: ['grade-submissions'],
    },
    {
        slug: 'setup-rubric',
        title: 'Setting Up a Rubric',
        description: 'Create a grading rubric with criteria, point values, and performance descriptors.',
        category: 'Grading',
        roles: ['FACULTY'],
        iconName: 'ClipboardList',
        estimatedTime: '5 min',
        steps: [
            { title: 'Open the Assignment', detail: 'Go to the assignment where you want to set up a rubric.' },
            { title: 'Navigate to the Rubric Tab', detail: 'Click the "Rubric" tab on the assignment detail page.' },
            { title: 'Add a Criterion', detail: 'Click "+ Add Criterion". Enter the criterion name (e.g. "Code Correctness") and its point value.' },
            { title: 'Add Level Descriptors', detail: 'For each criterion, add performance levels (e.g. Excellent, Good, Needs Improvement) with descriptions and point values.' },
            { title: 'Set Rubric Weight', detail: 'Back in assignment settings, set the Rubric Weight % (and corresponding Test Weight %). These must sum to 100%.' },
            { title: 'Save', detail: 'Click "Save Rubric". The rubric will appear in the grading workspace for all submissions.' },
        ],
        tips: [
            'Use rubric templates to reuse common rubrics across multiple assignments.',
            'If you\'re doing code-only auto-grading, set Rubric Weight to 0%.',
            'Clear descriptors make grading faster and more consistent.',
        ],
        relatedSlugs: ['create-assignment', 'grade-submissions'],
    },
    {
        slug: 'view-reports',
        title: 'Viewing Course Reports',
        description: 'Analyze class performance, submission rates, grade distributions, and student progress.',
        category: 'Reports',
        roles: ['FACULTY'],
        iconName: 'BarChart2',
        estimatedTime: '2 min',
        steps: [
            { title: 'Click "Reports" in the Nav', detail: 'Select "Reports" from the top navigation bar in your faculty dashboard.' },
            { title: 'Select a Course', detail: 'Use the course selector dropdown to choose which course to analyze.' },
            { title: 'Explore Grade Distribution', detail: 'View the histogram of score distributions across the selected assignment or the whole course.' },
            { title: 'Check Submission Rates', detail: 'See how many students submitted, how many were late, and how many missed the deadline.' },
            { title: 'Export Data', detail: 'Click "Export CSV" to download the grade report for your records or to import into another system.' },
        ],
        tips: [
            'Use reports before publishing grades to identify outliers.',
            'Compare assignment difficulty by looking at average scores side by side.',
        ],
        relatedSlugs: ['publish-grades'],
    },

    // ─── STUDENT ──────────────────────────────────────────────────────────────
    {
        slug: 'submit-assignment',
        title: 'Submitting an Assignment',
        description: 'Upload your code files and submit them for grading before the deadline.',
        category: 'Assignments',
        roles: ['STUDENT'],
        iconName: 'Upload',
        estimatedTime: '3 min',
        steps: [
            { title: 'Go to Assignments', detail: 'Click "Assignments" in the top navigation bar of your student dashboard.' },
            { title: 'Find Your Assignment', detail: 'Locate the assignment in the list. Upcoming assignments are sorted by due date.' },
            { title: 'Click the Assignment', detail: 'Click the assignment title to open the detail page with the problem description and instructions.' },
            { title: 'Read the Instructions', detail: 'Carefully read the assignment description, instructions, and any starter code provided.' },
            { title: 'Upload Your File(s)', detail: 'Click "Upload Files" or drag and drop your code files into the submission area. Make sure you match the required file names.' },
            { title: 'Submit', detail: 'Click "Submit". You\'ll see a confirmation and your submission status will update to "Submitted".' },
            { title: 'Check Test Results', detail: 'After submission, view the auto-grading results for visible test cases to see if your solution passes.' },
        ],
        tips: [
            'You can submit multiple times up to the attempt limit — only the latest (or best) submission counts.',
            'Late submissions are accepted until the grace period ends, but a penalty may apply.',
            'Double-check that your file names match exactly what the instructor specified.',
        ],
        relatedSlugs: ['view-grades', 'view-feedback'],
    },
    {
        slug: 'view-grades',
        title: 'Viewing Your Grades',
        description: 'Check your scores, feedback, and overall progress across all assignments.',
        category: 'Grades',
        roles: ['STUDENT'],
        iconName: 'Award',
        estimatedTime: '2 min',
        steps: [
            { title: 'Click "Grades" in the Nav', detail: 'Select "Grades" from the top navigation bar.' },
            { title: 'Browse Your Assignments', detail: 'The grades page lists all graded assignments with your score and the maximum possible score.' },
            { title: 'Click an Assignment', detail: 'Click any row to see the full grade breakdown — test case results, rubric scores, and instructor comments.' },
            { title: 'Check Overall Average', detail: 'Your overall course average is shown at the top of each course section.' },
        ],
        tips: [
            'Grades are only visible after the instructor publishes them.',
            'If you believe a grade is incorrect, contact your instructor directly.',
        ],
        relatedSlugs: ['view-feedback', 'submit-assignment'],
    },
    {
        slug: 'access-courses',
        title: 'Accessing Your Courses',
        description: 'Find and navigate your enrolled courses and their assignments.',
        category: 'Courses',
        roles: ['STUDENT'],
        iconName: 'BookOpen',
        estimatedTime: '1 min',
        steps: [
            { title: 'Click "My Courses"', detail: 'Select "My Courses" in the top navigation bar.' },
            { title: 'Browse Your Courses', detail: 'All your enrolled courses are displayed as cards with the course code, name, and assignment count.' },
            { title: 'Open a Course', detail: 'Click a course card to view its assignments, announcements, and resources.' },
            { title: 'View Assignments', detail: 'The Assignments tab shows all published assignments with due dates and your submission status.' },
        ],
        tips: [
            'Your dashboard shows upcoming assignments across all courses at a glance.',
            'If a course is missing, contact your instructor — you may need to be enrolled.',
        ],
        relatedSlugs: ['submit-assignment', 'view-grades'],
    },
    {
        slug: 'view-feedback',
        title: 'Reading Assignment Feedback',
        description: 'View instructor comments, rubric scores, and test case results for a graded submission.',
        category: 'Grades',
        roles: ['STUDENT'],
        iconName: 'MessageSquare',
        estimatedTime: '2 min',
        steps: [
            { title: 'Go to Grades', detail: 'Navigate to the Grades page from the top nav.' },
            { title: 'Click an Assignment', detail: 'Click on the graded assignment you want to review.' },
            { title: 'View Test Case Results', detail: 'The Test Results section shows which visible test cases passed or failed and the points earned.' },
            { title: 'Check the Rubric', detail: 'The Rubric section shows scores per criterion and the instructor\'s reasoning.' },
            { title: 'Read Comments', detail: 'Scroll to the Feedback section to read the instructor\'s overall comments on your work.' },
        ],
        tips: [
            'Use feedback to improve your approach on future assignments.',
            'If grades haven\'t appeared yet, the instructor hasn\'t published them.',
        ],
        relatedSlugs: ['view-grades'],
    },
    {
        slug: 'track-progress',
        title: 'Tracking Your Progress',
        description: 'Monitor your performance trends, submission history, and upcoming deadlines.',
        category: 'Grades',
        roles: ['STUDENT'],
        iconName: 'TrendingUp',
        estimatedTime: '2 min',
        steps: [
            { title: 'Click "Progress" in the Nav', detail: 'Select "Progress" from the top navigation bar.' },
            { title: 'View Score Trends', detail: 'The progress chart shows your score trajectory across all assignments in each course.' },
            { title: 'Check Upcoming Deadlines', detail: 'The calendar on the right sidebar highlights upcoming due dates. Click a date to see what\'s due.' },
            { title: 'Review Submission History', detail: 'See all your past submissions including timestamps and scores for each attempt.' },
        ],
        tips: [
            'Use the calendar on the dashboard to stay ahead of deadlines.',
            'A declining trend is a signal to seek help from your instructor or TA.',
        ],
        relatedSlugs: ['view-grades', 'submit-assignment'],
    },

    // ─── ASSISTANT ────────────────────────────────────────────────────────────
    {
        slug: 'grade-submission-assistant',
        title: 'Grading a Submission',
        description: 'Review student code, apply rubric scores, and write feedback as a grading assistant.',
        category: 'Grading',
        roles: ['ASSISTANT'],
        iconName: 'Target',
        estimatedTime: '4 min',
        steps: [
            { title: 'Open Your Assigned Course', detail: 'Click "My Courses" and select the course you\'ve been assigned to grade.' },
            { title: 'Find the Assignment', detail: 'Navigate to the Assignments tab and find the assignment with a pending grading deadline.' },
            { title: 'Open the Submissions List', detail: 'Click into the assignment and go to the Submissions tab.' },
            { title: 'Select a Student', detail: 'Click "Grade" next to an ungraded student submission.' },
            { title: 'Review the Code', detail: 'Read through the submitted code in the code viewer. Check for correctness and code quality.' },
            { title: 'Score the Rubric', detail: 'Fill in each rubric criterion score. Make sure you follow the grading guidelines set by the instructor.' },
            { title: 'Write Feedback', detail: 'Add constructive comments in the Feedback box. Be specific about what was done well and what could improve.' },
            { title: 'Save', detail: 'Click "Save Grade" to record your grade. Move to the next student using the navigation arrows.' },
        ],
        tips: [
            'Check the grading deadline — late grading may affect your assignment.',
            'If you\'re unsure about a score, leave a note and flag it for the instructor.',
            'Be consistent — apply the same standards across all students.',
        ],
        relatedSlugs: ['view-assigned-courses', 'grading-deadlines'],
    },
    {
        slug: 'view-assigned-courses',
        title: 'Viewing Your Assigned Courses',
        description: 'Find all the courses you have been assigned to as a grading assistant.',
        category: 'Courses',
        roles: ['ASSISTANT'],
        iconName: 'BookOpen',
        estimatedTime: '1 min',
        steps: [
            { title: 'Go to My Courses', detail: 'Click "My Courses" in the top navigation bar from your assistant dashboard.' },
            { title: 'Browse Assigned Courses', detail: 'All courses where you\'ve been assigned as an assistant are listed here with their details.' },
            { title: 'Open a Course', detail: 'Click a course card to see its assignments, student roster, and your grading queue.' },
        ],
        tips: [
            'If you\'re missing a course, contact the faculty member — they need to add you as an assistant.',
        ],
        relatedSlugs: ['grade-submission-assistant', 'grading-deadlines'],
    },
    {
        slug: 'grading-deadlines',
        title: 'Understanding Grading Deadlines',
        description: 'Learn how to track and meet grading deadlines set by faculty for each assignment.',
        category: 'Grading',
        roles: ['ASSISTANT'],
        iconName: 'Clock',
        estimatedTime: '2 min',
        steps: [
            { title: 'Check the Dashboard Calendar', detail: 'Your dashboard calendar shows all upcoming grading deadlines highlighted in orange.' },
            { title: 'Find Deadline Details', detail: 'Click a highlighted date on the calendar to see which assignments need grading by that date.' },
            { title: 'Prioritize Your Queue', detail: 'Assignments with the nearest deadlines appear at the top of your grading queue.' },
            { title: 'Track Progress', detail: 'The assignment\'s gradebook tab shows how many submissions you\'ve graded vs. the total.' },
        ],
        tips: [
            'Start grading early — rushing leads to inconsistent feedback.',
            'You\'ll receive a notification reminder before a grading deadline.',
        ],
        relatedSlugs: ['grade-submission-assistant'],
    },

    // ─── ADMIN ────────────────────────────────────────────────────────────────
    {
        slug: 'create-user',
        title: 'Creating a User Account',
        description: 'Manually add a new faculty, student, assistant, or admin account to the system.',
        category: 'User Management',
        roles: ['ADMIN'],
        iconName: 'UserPlus',
        estimatedTime: '2 min',
        steps: [
            { title: 'Go to Users', detail: 'Click "Users" in the top navigation bar of the admin dashboard.' },
            { title: 'Click "Add User"', detail: 'Press the "+ Add User" button in the top-right corner.' },
            { title: 'Fill in User Details', detail: 'Enter the user\'s Full Name, Email, Role (Student/Faculty/Assistant/Admin), and optional Student ID.' },
            { title: 'Set a Password', detail: 'Either enter a temporary password or let the system generate one. The user should change it on first login.' },
            { title: 'Save', detail: 'Click "Create User". The account is immediately active.' },
        ],
        tips: [
            'For large class imports, use Bulk Import instead of creating users one by one.',
            'Set the role carefully — it determines what the user can access.',
            'Admins can reset any user\'s password from the user detail page.',
        ],
        relatedSlugs: ['bulk-import-students', 'manage-courses-admin'],
    },
    {
        slug: 'bulk-import-students',
        title: 'Bulk Importing Students',
        description: 'Import an entire class roster from a CSV file to create accounts and optionally enroll students.',
        category: 'User Management',
        roles: ['ADMIN'],
        iconName: 'Upload',
        estimatedTime: '4 min',
        steps: [
            { title: 'Go to Users', detail: 'Navigate to Users from the admin top nav.' },
            { title: 'Click "Bulk Import"', detail: 'Press the "Bulk Import" button to open the import dialog.' },
            { title: 'Download the Template', detail: 'Click "Download Template" to get the CSV format. Fill in: email, full_name, student_id columns.' },
            { title: 'Upload Your File', detail: 'Drag and drop your completed CSV file or click "Choose File" to select it.' },
            { title: 'Review the Preview', detail: 'Check the preview table for any errors (duplicate emails, invalid formats). Fix issues in the CSV if needed.' },
            { title: 'Confirm Import', detail: 'Click "Import Students". Accounts will be created for all valid rows.' },
        ],
        tips: [
            'Existing accounts (by email) are skipped without error — no duplicates are created.',
            'After importing, enroll students in their course from the course\'s Students tab.',
            'The template format must match exactly — extra columns are ignored.',
        ],
        relatedSlugs: ['create-user', 'manage-courses-admin'],
    },
    {
        slug: 'manage-courses-admin',
        title: 'Managing Courses',
        description: 'View, edit, activate, archive, or delete courses across all faculty.',
        category: 'Course Management',
        roles: ['ADMIN'],
        iconName: 'BookOpen',
        estimatedTime: '2 min',
        steps: [
            { title: 'Go to Courses', detail: 'Click "Courses" in the admin navigation bar.' },
            { title: 'Browse All Courses', detail: 'You\'ll see all courses across all faculty with their status, student count, and instructor.' },
            { title: 'Filter and Search', detail: 'Use the search bar and status filter to find specific courses.' },
            { title: 'Edit a Course', detail: 'Click the "..." menu on a course and select "Edit" to modify its details.' },
            { title: 'Archive or Delete', detail: 'Archiving hides a course from active views but preserves data. Deleting is permanent and removes all student data.' },
        ],
        tips: [
            'Archive instead of delete to preserve historical grade data.',
            'Only admins can delete courses — faculty can only archive theirs.',
        ],
        relatedSlugs: ['create-user'],
    },
    {
        slug: 'view-security-logs',
        title: 'Viewing Security & Audit Logs',
        description: 'Monitor user activity, login events, and administrative actions across the platform.',
        category: 'Security',
        roles: ['ADMIN'],
        iconName: 'Shield',
        estimatedTime: '2 min',
        steps: [
            { title: 'Go to Security', detail: 'Click "Security" in the admin top navigation bar.' },
            { title: 'Browse the Audit Log', detail: 'The audit log shows every significant action: logins, role changes, course creations, grade publications, and more.' },
            { title: 'Filter by User or Event', detail: 'Use the search and filter controls to narrow down events by user email, event type, or date range.' },
            { title: 'Export for Review', detail: 'Click "Export" to download the filtered log as a CSV for compliance or incident review.' },
        ],
        tips: [
            'Regularly review the audit log for unusual activity (e.g. grade changes after publish).',
            'Role changes and user deletions are always logged for accountability.',
        ],
        relatedSlugs: ['create-user', 'manage-courses-admin'],
    },
];

export function getGuideBySlug(slug: string): Guide | undefined {
    return GUIDES.find((g) => g.slug === slug);
}

export function getGuidesByRole(role: GuideRole): Guide[] {
    return GUIDES.filter((g) => g.roles.includes(role));
}

export function getCategoriesForRole(role: GuideRole): string[] {
    const cats = new Set(getGuidesByRole(role).map((g) => g.category));
    return Array.from(cats);
}

export const ROLE_META: Record<GuideRole, { label: string; color: string; bg: string; border: string; badge: string }> = {
    FACULTY:   { label: 'Faculty',   color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
    STUDENT:   { label: 'Student',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
    ASSISTANT: { label: 'Assistant', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700' },
    ADMIN:     { label: 'Admin',     color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700' },
};
