'use client';

import { useEffect, useState } from 'react';
import { InnerHeaderDesign } from '@/components/InnerHeaderDesign';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';
import {
    Server,
    Shield,
    Save,
    RefreshCw,
    CheckCircle
} from 'lucide-react';

interface SettingsSection {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('security');
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [settings, setSettings] = useState({
        // Security
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumber: true,
        passwordRequireSpecial: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        lockoutDuration: 15,

        // Code Execution
        defaultTimeout: 10,
        defaultMemoryLimit: 256,
        maxConcurrentJobs: 10,
        sandboxEnabled: true,
    });

    useEffect(() => {
        let isMounted = true;

        const loadSettings = async () => {
            try {
                const data = await apiClient.getSettings();
                if (!isMounted) return;
                setSettings((previous) => ({ ...previous, ...data }));
                setLoadError('');
            } catch {
                if (!isMounted) return;
                setLoadError('Unable to load admin settings.');
            } finally {
                if (isMounted) {
                    setIsLoadingSettings(false);
                }
            }
        };

        loadSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const saveMutation = useMutation({
        mutationFn: (data: any) => apiClient.updateSettings(data),
        onSuccess: () => setHasChanges(false),
    });

    const { data: systemHealthData } = useQuery({
        queryKey: ['system-health'],
        queryFn: () => apiClient.getSystemHealth(),
        refetchInterval: 30000,
    });

    const defaultSystemHealth = [
        { name: 'API Server', status: 'offline' },
        { name: 'Database', status: 'offline' },
        { name: 'File Storage', status: 'offline' },
        { name: 'Grading Engine', status: 'offline' },
    ];
    const systemHealth = systemHealthData?.services || defaultSystemHealth;
    const allSystemsOnline = systemHealth.every((service: { status: string }) => service.status === 'online');
    const lastCheckedLabel = systemHealthData?.checked_at
        ? new Date(systemHealthData.checked_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : 'just now';

    const sections: SettingsSection[] = [
        { id: 'system-health', title: 'System Health', description: 'Service status', icon: <Server className="w-5 h-5" /> },
        { id: 'security', title: 'Security', description: 'Password and authentication', icon: <Shield className="w-5 h-5" /> },
        { id: 'execution', title: 'Code Execution', description: 'Sandbox settings', icon: <Server className="w-5 h-5" /> },
    ];

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="space-y-6">
                <InnerHeaderDesign
                    title="System Settings"
                    subtitle="Configure system-wide settings and preferences"
                    actions={
                        hasChanges ? (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => window.location.reload()}
                                    className="bg-white/10 text-white hover:bg-white/20 hover:text-white border border-white/20"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Discard
                                </Button>
                                <Button
                                    onClick={() => saveMutation.mutate(settings)}
                                    disabled={saveMutation.isPending || isLoadingSettings}
                                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isLoadingSettings ? 'Loading Settings...' : 'Save Changes'}
                                </Button>
                            </div>
                        ) : undefined
                    }
                />

                {hasChanges && (
                    <Alert type="warning" title="Unsaved Changes">
                        You have unsaved changes. Don't forget to save before leaving.
                    </Alert>
                )}

                {loadError && (
                    <Alert type="error" title="Settings Load Failed">
                        {loadError}
                    </Alert>
                )}

                {isLoadingSettings && !loadError && (
                    <Alert type="info" title="Loading Settings">
                        Fetching the current admin settings from the server.
                    </Alert>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Navigation */}
                    <div className="lg:w-64 flex-shrink-0">
                        <Card>
                            <CardContent className="p-2">
                                <nav className="space-y-1">
                                    {sections.map(section => (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeSection === section.id
                                                ? 'bg-[#862733]/10 text-[#862733]'
                                                : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <span className={activeSection === section.id ? 'text-[#862733]' : 'text-gray-400'}>
                                                {section.icon}
                                            </span>
                                            <div>
                                                <p className="font-medium text-sm">{section.title}</p>
                                                <p className="text-xs text-gray-500">{section.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </nav>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Settings Content */}
                    <div className="flex-1">
                        {/* System Health */}
                        {activeSection === 'system-health' && (
                            <div className="w-full">
                                <Card className="w-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Server className="w-5 h-5 text-[#862733]" />
                                            System Health
                                        </CardTitle>
                                        <CardDescription>Live service status for the admin system</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <Badge variant={allSystemsOnline ? 'success' : 'warning'} className="w-fit">
                                                {allSystemsOnline ? 'All Systems Online' : 'System Degraded'}
                                            </Badge>
                                            <span className="text-xs text-gray-500">Last checked at {lastCheckedLabel}</span>
                                        </div>
                                        <div className="space-y-2.5">
                                            {systemHealth.map((service: { name: string; status: string }) => (
                                                <div key={service.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-2 h-2 rounded-full ${service.status === 'online' ? 'bg-green-500' :
                                                            service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`} />
                                                        <span className="text-sm font-medium text-gray-700 truncate">{service.name}</span>
                                                    </div>
                                                    <span className={`text-xs font-medium whitespace-nowrap ${service.status === 'online' ? 'text-green-700' : 'text-red-700'}`}>
                                                        {service.status === 'online' ? 'Online' : 'Offline'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={`rounded-lg border px-3 py-2.5 ${allSystemsOnline ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                            <div className="flex items-start gap-2.5">
                                                <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${allSystemsOnline ? 'text-green-600' : 'text-amber-600'}`} />
                                                <div>
                                                    <p className={`text-sm font-medium ${allSystemsOnline ? 'text-green-800' : 'text-amber-800'}`}>
                                                        {allSystemsOnline ? 'Everything is running smoothly' : 'Some services are currently unavailable'}
                                                    </p>
                                                    <p className={`text-xs mt-0.5 ${allSystemsOnline ? 'text-green-600' : 'text-amber-700'}`}>
                                                        System checks refresh automatically every 30 seconds.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Security Settings */}
                        {activeSection === 'security' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-[#862733]" />
                                        Security Settings
                                    </CardTitle>
                                    <CardDescription>Configure password policies and authentication</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-4">Password Policy</h3>
                                        <div className="space-y-4">
                                            <Input
                                                label="Minimum Password Length"
                                                type="number"
                                                value={settings.passwordMinLength.toString()}
                                                    onChange={(e) => updateSetting('passwordMinLength', Number.parseInt(e.target.value, 10) || 0)}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Switch
                                                    checked={settings.passwordRequireUppercase}
                                                    onChange={(checked) => updateSetting('passwordRequireUppercase', checked)}
                                                    label="Require Uppercase"
                                                />
                                                <Switch
                                                    checked={settings.passwordRequireLowercase}
                                                    onChange={(checked) => updateSetting('passwordRequireLowercase', checked)}
                                                    label="Require Lowercase"
                                                />
                                                <Switch
                                                    checked={settings.passwordRequireNumber}
                                                    onChange={(checked) => updateSetting('passwordRequireNumber', checked)}
                                                    label="Require Number"
                                                />
                                                <Switch
                                                    checked={settings.passwordRequireSpecial}
                                                    onChange={(checked) => updateSetting('passwordRequireSpecial', checked)}
                                                    label="Require Special Character"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <h3 className="font-medium text-gray-900 mb-4">Session & Login</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Session Timeout (minutes)"
                                                type="number"
                                                value={settings.sessionTimeout.toString()}
                                                onChange={(e) => updateSetting('sessionTimeout', Number.parseInt(e.target.value, 10) || 0)}
                                            />
                                            <Input
                                                label="Max Login Attempts"
                                                type="number"
                                                value={settings.maxLoginAttempts.toString()}
                                                onChange={(e) => updateSetting('maxLoginAttempts', Number.parseInt(e.target.value, 10) || 0)}
                                            />
                                            <Input
                                                label="Lockout Duration (minutes)"
                                                type="number"
                                                value={settings.lockoutDuration.toString()}
                                                onChange={(e) => updateSetting('lockoutDuration', Number.parseInt(e.target.value, 10) || 0)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Code Execution Settings */}
                        {activeSection === 'execution' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Server className="w-5 h-5 text-[#862733]" />
                                        Code Execution Settings
                                    </CardTitle>
                                    <CardDescription>Configure sandbox and execution limits</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Default Timeout (seconds)"
                                            type="number"
                                            value={settings.defaultTimeout.toString()}
                                            onChange={(e) => updateSetting('defaultTimeout', parseInt(e.target.value))}
                                        />
                                        <Input
                                            label="Default Memory Limit (MB)"
                                            type="number"
                                            value={settings.defaultMemoryLimit.toString()}
                                            onChange={(e) => updateSetting('defaultMemoryLimit', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <Input
                                        label="Max Concurrent Jobs"
                                        type="number"
                                        value={settings.maxConcurrentJobs.toString()}
                                        onChange={(e) => updateSetting('maxConcurrentJobs', parseInt(e.target.value))}
                                    />
                                    <div className="pt-4 border-t">
                                        <Switch
                                            checked={settings.sandboxEnabled}
                                            onChange={(checked) => updateSetting('sandboxEnabled', checked)}
                                            label="Enable Sandbox"
                                            description="Run code in isolated containers for security"
                                        />
                                    </div>
                                    <Alert type="info" title="Execution Environment">
                                        Code is executed in Docker containers with restricted network access and resource limits.
                                    </Alert>
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
