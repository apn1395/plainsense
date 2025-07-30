// Supabase Client Library
class SupabaseClient {
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }

  async signIn(email, password) {
    try {
      console.log('Attempting signin:', { email });

      const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey
        },
        body: JSON.stringify({
          email,
          password,
          data: {} // Optional user metadata
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          throw new Error('Please confirm your email before logging in.');
        }
        throw new Error(errorData.error?.message || errorData.msg || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Signin response:', data);

      if (!data.access_token) {
        throw new Error('Invalid response: missing access token');
      }

      return {
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            ...data.user
          },
          session: {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            expires_at: data.expires_at
          }
        },
        error: null
      };
    } catch (error) {
      console.error('Signin error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Login failed')
      };
    }
  }

  async signUp(email, password) {
    try {
      console.log('Attempting signup:', { email });

      // Use our website URL for verification
      const redirectTo = 'https://plainsense.co/verify';
      console.log('Redirect URL:', redirectTo);

      const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey
        },
        body: JSON.stringify({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo
          }
        })
      });

      const data = await response.json();
      console.log('Signup response:', data);

      if (!response.ok) {
        throw new Error(data.error?.message || data.msg || 'Signup failed');
      }

      return {
        data: {
          user: data.user,
          session: data.session
        },
        error: null
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Signup failed')
      };
    }
  }

  async createProfile(userId, data) {
    try {
      console.log('Creating profile:', { userId, data });
      
      const response = await fetch(`${this.supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: userId,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Profile creation failed:', error);
        throw new Error('Failed to create profile');
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Profile creation error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to create profile') 
      };
    }
  }

  async getProfile(userId) {
    try {
      console.log('Fetching profile:', userId);
      
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      return { data: data[0] || null, error: null };
    } catch (error) {
      console.error('Get profile error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to fetch profile') 
      };
    }
  }

  async getSession() {
    try {
      const { session, user } = await chrome.storage.local.get(['session', 'user']);
      if (!session || !user) {
        return { data: { session: null }, error: null };
      }
      return { data: { session, user }, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      return { data: { session: null }, error };
    }
  }
}

// Create and export the client creation function
window.createClient = function(url, key) {
  return new SupabaseClient(url, key);
}; 