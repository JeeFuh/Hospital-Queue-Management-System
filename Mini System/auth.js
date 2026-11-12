document.documentElement.hidden = true;           // hide page until verified
db.auth.getSession().then(({ data }) => {
  if (!data.session) return location.replace('login.html');
  document.documentElement.hidden = false;
});
document.getElementById('logout').onclick = async e => {
  e.preventDefault();
  await db.auth.signOut();
  location.replace('login.html');
};