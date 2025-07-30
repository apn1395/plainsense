document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup initialized');

  // Initialize Supabase
  const supabaseUrl = 'https://ajxdirwzfutdjhwgdirm.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqeGRpcnd6ZnV0ZGpod2dkaXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2Mjk1NjMsImV4cCI6MjA2OTIwNTU2M30.wYQ5Bsmw-8qc_opP7w_Au5tWMTM3bXgVu1Z0LRrZQ-U';
  window.supabase = window.createClient(supabaseUrl, supabaseKey);
  console.log('Supabase initialized');

  // Get DOM elements
  const authView = document.getElementById('auth-view');
  const portfolioView = document.getElementById('portfolio-view');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tokenForm = document.getElementById('token-form');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');
  const tokenError = document.getElementById('token-error');
  const tickersInput = document.getElementById('tickers');
  const saveButton = document.getElementById('save');
  const successMessage = document.getElementById('success');
  const logoutButton = document.getElementById('logout');
  const usageCount = document.getElementById('usage-count');
  const usageLimit = document.getElementById('usage-limit');

  // Show appropriate view
  const showAuthView = () => {
    authView.classList.add('active');
    portfolioView.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tokenForm.style.display = 'none';
  };

  const showPortfolioView = (profile) => {
    authView.classList.remove('active');
    portfolioView.classList.add('active');
    if (profile) {
      usageCount.textContent = profile.usage_count || 0;
      usageLimit.textContent = profile.usage_limit || 50;
    }
  };

  // Check authentication status
  const checkAuth = async () => {
    try {
      console.log('Checking auth status...');
      const { data: { session, user }, error: sessionError } = await window.supabase.getSession();
      console.log('Session check result:', { session, user, error: sessionError });

      if (sessionError) throw sessionError;

      if (session && user) {
        const { data: profile, error: profileError } = await window.supabase.getProfile(user.id);
        if (profileError) throw profileError;
        showPortfolioView(profile);
        return true;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
    showAuthView();
    return false;
  };

  // Tab switching logic
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tokenForm.style.display = 'none';
      } else if (tab.dataset.tab === 'register') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tokenForm.style.display = 'none';
      }
    });
  });

  // Show token form button
  document.getElementById('show-token-form').addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    tokenForm.style.display = 'block';
  });

  // Token verification from URL
  document.getElementById('verify-from-url').addEventListener('click', async () => {
    const urlInput = document.getElementById('verification-url').value.trim();
    const token = urlInput.split('token=')[1]?.split('&')[0];
    const tokenError = document.getElementById('token-error');

    if (!token) {
      tokenError.textContent = 'Invalid URL. Please paste the entire verification URL from your email.';
      tokenError.style.display = 'block';
      return;
    }

    try {
      console.log('Verifying token:', token);
      tokenError.style.display = 'none';

      const response = await fetch(`${supabaseUrl}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          type: 'signup',
          token: token
        })
      });

      const data = await response.json();
      console.log('Verification response:', data);

      if (!response.ok) {
        throw new Error(data.error?.message || data.msg || 'Verification failed');
      }

      // Create profile after successful confirmation
      try {
        const userId = data.user?.id;
        if (userId) {
          console.log('Creating profile for user:', userId);
          const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${data.access_token}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              id: userId,
              plan: 'free',
              usage_count: 0,
              usage_limit: 50
            })
          });

          if (!profileResponse.ok) {
            console.error('Failed to create profile:', await profileResponse.text());
          } else {
            console.log('Profile created successfully');
          }
        }
      } catch (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // Show success and switch to login form
      tokenError.style.color = '#059669';
      tokenError.textContent = 'Email confirmed! You can now log in.';
      tokenError.style.display = 'block';

      setTimeout(() => {
        tokenForm.style.display = 'none';
        loginForm.style.display = 'block';
        document.querySelector('[data-tab="login"]').click();
      }, 2000);

    } catch (error) {
      console.error('Token confirmation error:', error);
      tokenError.style.color = '#dc2626';
      tokenError.textContent = error.message;
      tokenError.style.display = 'block';
    }
  });

  // Register handler
  document.getElementById('register-button').addEventListener('click', async () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
      console.log('Attempting registration...', { email });
      registerError.style.display = 'none';
      
      const { data, error } = await window.supabase.signUp(email, password);
      console.log('Registration response:', { data, error });

      if (error) throw error;

      registerError.style.display = 'block';
      registerError.style.color = '#059669';
      registerError.textContent = 'Registration successful! Please check your email and click the verification link. Then come back here and use the "Enter Verification URL" button to complete your registration.';

      // Clear the form
      document.getElementById('register-email').value = '';
      document.getElementById('register-password').value = '';
      
    } catch (error) {
      console.error('Registration error:', error);
      registerError.style.color = '#dc2626';
      registerError.textContent = error.message;
      registerError.style.display = 'block';
    }
  });

  // Login handler
  document.getElementById('login-button').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      console.log('Attempting login...', { email });
      loginError.style.display = 'none';
      
      const { data, error } = await window.supabase.signIn(email, password);
      console.log('Login response:', { data, error });

      if (error) throw error;
      if (!data?.session?.access_token) throw new Error('Invalid login response');

      console.log('Login successful, saving session...');
      await chrome.storage.local.set({
        session: data.session,
        user: data.user
      });

      console.log('Session saved, fetching profile...');
      const { data: profile, error: profileError } = await window.supabase.getProfile(data.user.id);
      
      if (profileError) {
        console.log('Profile not found, creating new profile...');
        const { error: createError } = await window.supabase.createProfile(data.user.id, {
          plan: 'free',
          usage_count: 0,
          usage_limit: 50
        });
        if (createError) throw createError;
        
        const { data: newProfile } = await window.supabase.getProfile(data.user.id);
        showPortfolioView(newProfile);
      } else {
        showPortfolioView(profile);
      }
    } catch (error) {
      console.error('Login error:', error);
      loginError.textContent = error.message;
      loginError.style.display = 'block';
    }
  });

  // Logout handler
  document.getElementById('logout').addEventListener('click', async () => {
    try {
      console.log('Attempting logout...');
      await window.supabase.signOut();
      await chrome.storage.local.remove(['session', 'user', 'tickers']);
      console.log('Logout successful');
      showAuthView();
    } catch (error) {
      console.error('Logout error:', error);
    }
  });

  // Save portfolio handler
  document.getElementById('save').addEventListener('click', async () => {
    const tickersText = tickersInput.value;
    const tickers = tickersText
      .split(',')
      .map(ticker => ticker.trim().toUpperCase())
      .filter(ticker => ticker.length > 0);

    await chrome.storage.local.set({ tickers });

    successMessage.textContent = 'Portfolio saved!';
    successMessage.style.display = 'block';
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 2000);
  });

  // Initialize
  await checkAuth();
}); 