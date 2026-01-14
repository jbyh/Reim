import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  User, 
  Key, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Lock
} from 'lucide-react';

export const Profile = () => {
  const { user, profile, loading, signOut, updateProfile, saveAlpacaCredentials, hasAlpacaCredentials } = useAuth();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState('');
  const [alpacaApiKey, setAlpacaApiKey] = useState('');
  const [alpacaSecretKey, setAlpacaSecretKey] = useState('');
  const [paperTrading, setPaperTrading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      // Don't populate encrypted keys - they can't be decrypted client-side
      setPaperTrading(profile.alpaca_paper_trading ?? true);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    const { error } = await updateProfile({
      display_name: displayName || null,
    });
    
    setIsSaving(false);
    
    if (error) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile updated!');
    }
  };

  const handleSaveAlpacaCredentials = async () => {
    if (!alpacaApiKey || !alpacaSecretKey) {
      toast.error('Please enter both API Key and Secret Key');
      return;
    }

    // Basic validation
    if (alpacaApiKey.includes('=') || alpacaSecretKey.includes('=')) {
      toast.error('Please enter only the key value, not the full variable assignment');
      return;
    }

    setIsSaving(true);
    
    const result = await saveAlpacaCredentials(alpacaApiKey.trim(), alpacaSecretKey.trim(), paperTrading);
    
    setIsSaving(false);
    
    if (result.error) {
      toast.error('Failed to save Alpaca credentials');
    } else {
      toast.success('Alpaca credentials saved securely! Your trades will now sync with your account.');
      // Clear the input fields after successful save
      setAlpacaApiKey('');
      setAlpacaSecretKey('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Alpaca Credentials Card */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Key className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  Alpaca Trading
                  {hasAlpacaCredentials ? (
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-success bg-success/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-destructive bg-destructive/20 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" />
                      Not Connected
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Connect your Alpaca account to trade</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Security Note */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
              <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">Encrypted Storage</p>
                <p className="text-muted-foreground">
                  Your API keys are encrypted before being stored and can only be decrypted server-side for trading operations.
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                How to get your Alpaca API keys
              </h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Log in to your <a href="https://app.alpaca.markets" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Alpaca account <ExternalLink className="h-3 w-3" /></a></li>
                <li>Switch to <strong>Paper Trading</strong> mode</li>
                <li>Go to <strong>API Keys</strong> section</li>
                <li>Generate new API keys and paste them below</li>
              </ol>
            </div>

            {hasAlpacaCredentials && (
              <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-success">Keys Configured</p>
                  <p className="text-muted-foreground">
                    Your Alpaca credentials are securely stored. Enter new keys below to update them.
                  </p>
                </div>
              </div>
            )}

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="alpacaApiKey">API Key ID</Label>
              <div className="relative">
                <Input
                  id="alpacaApiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={hasAlpacaCredentials ? "Enter new key to update" : "PKXXXXXXXXXXXXXXXX"}
                  value={alpacaApiKey}
                  onChange={(e) => setAlpacaApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Secret Key */}
            <div className="space-y-2">
              <Label htmlFor="alpacaSecretKey">Secret Key</Label>
              <div className="relative">
                <Input
                  id="alpacaSecretKey"
                  type={showSecretKey ? 'text' : 'password'}
                  placeholder={hasAlpacaCredentials ? "Enter new key to update" : "••••••••••••••••••••"}
                  value={alpacaSecretKey}
                  onChange={(e) => setAlpacaSecretKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Paper Trading Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
              <div>
                <Label htmlFor="paperTrading" className="font-medium">Paper Trading</Label>
                <p className="text-sm text-muted-foreground">
                  Use paper trading for risk-free practice
                </p>
              </div>
              <Switch
                id="paperTrading"
                checked={paperTrading}
                onCheckedChange={setPaperTrading}
              />
            </div>

            {!paperTrading && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Live Trading Mode</p>
                  <p className="text-muted-foreground">
                    You are about to enable live trading. Real money will be used for trades.
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSaveAlpacaCredentials} 
              disabled={isSaving || !alpacaApiKey || !alpacaSecretKey}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Encrypting & Saving...
                </>
              ) : hasAlpacaCredentials ? (
                'Update Alpaca Credentials'
              ) : (
                'Connect Alpaca Account'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
