'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Bot, 
  Key, 
  Settings, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  Database,
  Gauge,
  Server,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  getProviders,
  getProviderKey,
  getAISettings,
  getUsageStats,
  updateProvider,
  updateAISettings,
  testProvider,
} from '@/lib/ai/ai-config-api';

// Tab triggers styled to mirror the admin sidebar nav buttons: rounded-xl
// shape, muted idle state, soft primary gradient + primary-tinted icon when
// active. Scoped here so the shared Tabs component (analytics, moderation)
// keeps its pill style.
const tabTriggerClass = cn(
  'justify-start rounded-xl px-3 py-2 text-muted-foreground transition-all',
  'hover:bg-muted/60 hover:text-foreground',
  'data-[state=active]:bg-transparent data-[state=active]:bg-gradient-to-r',
  'data-[state=active]:from-primary/15 data-[state=active]:via-primary/8 data-[state=active]:to-transparent',
  'data-[state=active]:text-foreground data-[state=active]:shadow-sm',
  'data-[state=active]:[&_svg]:text-primary',
);

interface ProviderConfig {
  name: string;
  displayName: string;
  enabled: boolean;
  apiKey?: string;
  apiKeyLastFour?: string;
  baseUrl?: string;
  defaultModel: string;
  availableModels: string[];
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  maxTokens: number;
  rateLimitTier: 'free' | 'standard' | 'premium';
}

interface AISettings {
  activeProvider: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  features: {
    enableStreaming: boolean;
    enableFunctionCalling: boolean;
    enablePdfGeneration: boolean;
    enableChatSessions: boolean;
    enableAdminTools: boolean;
  };
}

interface UsageStats {
  totalRequests: number;
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };
  byProvider: Record<string, { requests: number; tokens: number; errors: number }>;
  averageLatency: number;
  errorRate: number;
}

export default function AISettingsPage() {
  const t = useTranslations('AISettings');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('providers');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  // Data states
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [settings, setSettings] = useState<AISettings>({
    activeProvider: 'openrouter',
    defaultModel: 'openai/gpt-4o-mini',
    maxTokens: 1024,
    temperature: 0.4,
    features: {
      enableStreaming: true,
      enableFunctionCalling: true,
      enablePdfGeneration: true,
      enableChatSessions: true,
      enableAdminTools: true,
    },
  });
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Form states
  const [selectedProvider, setSelectedProvider] = useState<string>('openrouter');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [isRevealingKey, setIsRevealingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  // Reset the key field when switching providers so one provider's key never
  // leaks into another's form.
  useEffect(() => {
    setApiKeyInput('');
    setShowApiKey(false);
  }, [selectedProvider]);

  // Returns the key to act on: whatever the admin typed, or the stored key
  // fetched on demand (the stored key is never sent on initial load).
  const resolveApiKey = async (): Promise<string> => {
    if (apiKeyInput) return apiKeyInput;
    const provider = providers.find(p => p.name === selectedProvider);
    if (!provider?.apiKeyLastFour) return '';
    setIsRevealingKey(true);
    try {
      const key = await getProviderKey(selectedProvider);
      setApiKeyInput(key);
      return key;
    } finally {
      setIsRevealingKey(false);
    }
  };

  const handleToggleApiKey = async () => {
    if (showApiKey) {
      setShowApiKey(false);
      return;
    }
    try {
      await resolveApiKey();
      setShowApiKey(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to reveal API key',
        variant: 'destructive',
      });
    }
  };

  const handleCopyApiKey = async () => {
    try {
      const value = await resolveApiKey();
      if (!value) return;
      await navigator.clipboard.writeText(value);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 1500);
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to copy API key',
        variant: 'destructive',
      });
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [providersData, settingsData, usageData] = await Promise.all([
        getProviders().catch(() => [] as ProviderConfig[]),
        getAISettings().catch(() => null),
        getUsageStats(30).catch(() => null),
      ]);

      setProviders(providersData || []);

      if (settingsData) {
        setSettings(prev => ({ ...prev, ...settingsData }));
        setSelectedProvider(settingsData.activeProvider || 'openrouter');
      } else if (providersData && providersData.length > 0) {
        setSelectedProvider(prev => providersData.some(p => p.name === prev) ? prev : providersData[0].name);
      }

      if (usageData) {
        setUsageStats(usageData);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load AI settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProvider = async () => {
    setIsSaving(true);
    try {
      const provider = providers.find(p => p.name === selectedProvider);
      if (!provider) return;

      const updateData: Partial<ProviderConfig> = {
        enabled: provider.enabled,
        defaultModel: provider.defaultModel,
        maxTokens: provider.maxTokens,
        rateLimitTier: provider.rateLimitTier,
      };

      // Only include API key if it was changed (not masked)
      if (apiKeyInput && !apiKeyInput.includes('*')) {
        updateData.apiKey = apiKeyInput;
      }

      await updateProvider(selectedProvider, updateData);

      toast({
        title: 'Success',
        description: 'Provider settings saved successfully',
      });
      setApiKeyInput('');
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to save provider settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestProvider = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const provider = providers.find(p => p.name === selectedProvider);
      if (!provider) return;

      const apiKey = apiKeyInput && !apiKeyInput.includes('*') 
        ? apiKeyInput 
        : undefined;

      // If no new API key provided, we can't test without the stored key
      if (!apiKey && !provider.apiKeyLastFour) {
        throw new Error('No API key available for testing');
      }

      const data = await testProvider(
        selectedProvider,
        apiKey || 'using-stored-key',
        provider.defaultModel,
      );
      setTestResult({
        success: data.success,
        message: data.message,
        latency: data.data?.latency,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: (error as Error).message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveGeneralSettings = async () => {
    setIsSaving(true);
    try {
      await updateAISettings(settings);
      toast({
        title: 'Success',
        description: 'General settings saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (enabled: boolean) => {
    return enabled ? (
      <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-500/10 text-gray-600">
        <XCircle className="mr-1 h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="AI Configuration"
        description="Manage AI providers, API credentials, and system-wide AI settings"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 gap-1 rounded-xl border-border/60 bg-card/40 p-1.5 lg:w-auto">
          <TabsTrigger value="providers" className={tabTriggerClass}>
            <Server className="mr-2 h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="settings" className={tabTriggerClass}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="usage" className={tabTriggerClass}>
            <Activity className="mr-2 h-4 w-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="tools" className={tabTriggerClass}>
            <Bot className="mr-2 h-4 w-4" />
            Tools
          </TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Configuration</CardTitle>
              <CardDescription>
                Configure AI providers and their API credentials. At least one provider must be active.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider Selector */}
              <div className="space-y-2">
                <Label htmlFor="provider">Select Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        <div className="flex items-center gap-2">
                          {p.displayName}
                          {getStatusBadge(p.enabled)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProvider && (
                <>
                  <Separator />
                  
                  {/* Provider Settings */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* API Key */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="apiKey">
                        API Key
                        {providers.find(p => p.name === selectedProvider)?.apiKeyLastFour && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Current: ****{providers.find(p => p.name === selectedProvider)?.apiKeyLastFour})
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id="apiKey"
                          type={showApiKey ? 'text' : 'password'}
                          placeholder="Enter API key"
                          autoComplete="off"
                          className="pr-20"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={handleToggleApiKey}
                            disabled={isRevealingKey || (!apiKeyInput && !providers.find(p => p.name === selectedProvider)?.apiKeyLastFour)}
                            aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                            title={showApiKey ? 'Hide API key' : 'Show API key'}
                            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                          >
                            {isRevealingKey ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : showApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyApiKey}
                            disabled={isRevealingKey || (!apiKeyInput && !providers.find(p => p.name === selectedProvider)?.apiKeyLastFour)}
                            aria-label="Copy API key"
                            title="Copy API key"
                            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                          >
                            {apiKeyCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave empty to keep the current key. Use the eye icon to reveal the saved
                        key or the copy icon to copy it.
                      </p>
                    </div>

                    {/* Default Model — type a custom model id or pick a suggestion */}
                    <div className="space-y-2">
                      <Label htmlFor="model">Default Model</Label>
                      <Input
                        id="model"
                        list="model-options"
                        placeholder="Type or select a model"
                        autoComplete="off"
                        value={providers.find(p => p.name === selectedProvider)?.defaultModel || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setProviders(prev => prev.map(p =>
                            p.name === selectedProvider ? { ...p, defaultModel: value } : p
                          ));
                        }}
                      />
                      <datalist id="model-options">
                        {providers.find(p => p.name === selectedProvider)?.availableModels?.map((model) => (
                          <option key={model} value={model} />
                        ))}
                      </datalist>
                      <p className="text-xs text-muted-foreground">
                        Choose from the list or enter any custom model id.
                      </p>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens ({providers.find(p => p.name === selectedProvider)?.maxTokens})</Label>
                      <Slider
                        id="maxTokens"
                        min={256}
                        max={4096}
                        step={256}
                        value={[providers.find(p => p.name === selectedProvider)?.maxTokens || 1024]}
                        onValueChange={([value]) => {
                          setProviders(prev => prev.map(p => 
                            p.name === selectedProvider ? { ...p, maxTokens: value } : p
                          ));
                        }}
                      />
                    </div>

                    {/* Rate Limit Tier */}
                    <div className="space-y-2">
                      <Label htmlFor="tier">Rate Limit Tier</Label>
                      <Select 
                        value={providers.find(p => p.name === selectedProvider)?.rateLimitTier} 
                        onValueChange={(value: 'free' | 'standard' | 'premium') => {
                          setProviders(prev => prev.map(p => 
                            p.name === selectedProvider ? { ...p, rateLimitTier: value } : p
                          ));
                        }}
                      >
                        <SelectTrigger id="tier">
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Enabled Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="enabled">Provider Enabled</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable or disable this provider for AI requests
                        </p>
                      </div>
                      <Switch
                        id="enabled"
                        checked={providers.find(p => p.name === selectedProvider)?.enabled}
                        onCheckedChange={(checked) => {
                          setProviders(prev => prev.map(p => 
                            p.name === selectedProvider ? { ...p, enabled: checked } : p
                          ));
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestProvider}
                  disabled={isTesting || !selectedProvider}
                >
                  {isTesting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
              </div>
              <Button 
                onClick={handleSaveProvider}
                disabled={isSaving || !selectedProvider}
              >
                {isSaving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Provider
              </Button>
            </CardFooter>
          </Card>

          {/* Test Result */}
          {testResult && (
            <Card className={testResult.success ? 'border-green-500/50' : 'border-red-500/50'}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {testResult.success ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {testResult.message}
                    </p>
                    {testResult.latency && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Latency: {testResult.latency}ms
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General AI Settings</CardTitle>
              <CardDescription>
                Configure system-wide AI behavior and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Temperature */}
                <div className="space-y-2">
                  <Label>Temperature ({settings.temperature})</Label>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[settings.temperature]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, temperature: value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower values make output more deterministic
                  </p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <Label>Max Tokens ({settings.maxTokens})</Label>
                  <Slider
                    min={256}
                    max={4096}
                    step={256}
                    value={[settings.maxTokens]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, maxTokens: value }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Feature Toggles */}
              <div className="space-y-4">
                <Label>Features</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { key: 'enableStreaming', label: 'Streaming', desc: 'Stream responses in real-time' },
                    { key: 'enableFunctionCalling', label: 'Function Calling', desc: 'Enable AI tool usage' },
                    { key: 'enablePdfGeneration', label: 'PDF Generation', desc: 'Generate PDF reports' },
                    { key: 'enableChatSessions', label: 'Chat Sessions', desc: 'Persistent chat history' },
                    { key: 'enableAdminTools', label: 'Admin Tools', desc: 'Extended admin capabilities' },
                  ].map((feature) => (
                    <div
                      key={feature.key}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-0.5">
                        <Label htmlFor={feature.key}>{feature.label}</Label>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                      <Switch
                        id={feature.key}
                        checked={settings.features[feature.key as keyof typeof settings.features]}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({
                            ...prev,
                            features: { ...prev.features, [feature.key]: checked },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneralSettings} disabled={isSaving}>
                {isSaving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats?.totalRequests?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats?.totalTokens?.total?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  In: {usageStats?.totalTokens?.input?.toLocaleString() || 0} / 
                  Out: {usageStats?.totalTokens?.output?.toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats?.averageLatency || 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  {usageStats && usageStats.averageLatency < 500 ? 'Good' : usageStats && usageStats.averageLatency < 1000 ? 'Fair' : 'Poor'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((usageStats?.errorRate || 0) * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {usageStats && usageStats.errorRate < 0.01 ? 'Excellent' : usageStats && usageStats.errorRate < 0.05 ? 'Good' : 'Needs Attention'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Provider Usage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Usage Breakdown</CardTitle>
              <CardDescription>Usage statistics by AI provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageStats?.byProvider && Object.entries(usageStats.byProvider).map(([provider, stats]) => (
                  <div key={provider} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Server className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{provider}</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.requests.toLocaleString()} requests • {stats.errors} errors
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{stats.tokens.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">tokens</p>
                    </div>
                  </div>
                ))}
                {(!usageStats?.byProvider || Object.keys(usageStats.byProvider).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No usage data available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Tools Configuration</CardTitle>
              <CardDescription>
                Manage AI tool capabilities and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Client Tools */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Client Tools</CardTitle>
                    <CardDescription>Available to regular users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {[
                        'getUserStats - View worship statistics',
                        'getSalahHistory - Prayer tracking history',
                        'getQuranProgress - Quran reading progress',
                        'getDhikrHistory - Dhikr tracking',
                        'getHabitsProgress - Habit completion',
                        'calculatePoints - Calculate potential points',
                      ].map((tool) => (
                        <li key={tool} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {tool}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Admin Tools */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Admin Tools</CardTitle>
                    <CardDescription>Available to administrators only</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {[
                        'listUsers - List and search users',
                        'getUserDetails - View user details',
                        'suspendUser - Suspend/unsuspend users',
                        'getPlatformAnalytics - Platform-wide analytics',
                        'getModerationQueue - View moderation queue',
                        'moderateContent - Approve/reject content',
                        'getSystemHealth - System health status',
                        'getRecentAuditLogs - View audit logs',
                      ].map((tool) => (
                        <li key={tool} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          {tool}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
