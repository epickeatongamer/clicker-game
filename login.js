const SUPABASE_URL = 'https://dhjdnaegkbyezgdhmbsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoamRuYWVna2J5ZXpnZGhtYnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNTYyNzQsImV4cCI6MjA2NjgzMjI3NH0.mPiR18GLpRWXXlNqueO-d1WqpKkwDC_Sd8Xh78BSd8';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const signInBtn = document.getElementById('sign-in-btn');
const signUpBtn = document.getElementById('sign-up-btn');

window.onload = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    window.location.href = 'game.html';
  }
};

signUpBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert('Sign up error: ' + error.message);
  else alert('Check your email to verify your account.');
});

signInBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert('Sign in error: ' + error.message);
  else window.location.href = 'game.html';
});
