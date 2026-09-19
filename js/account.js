  /* ---------- Koala avatar with accessories ---------- */
  const koalaBase = `
    <circle cx="22" cy="30" r="16"/>
    <circle cx="78" cy="30" r="16"/>
    <circle cx="50" cy="55" r="32"/>
  `;
 
  const koalaFace = `
    <g class="avatar-eye"><circle cx="38" cy="50" r="6" fill="#fff"/><circle cx="38" cy="50" r="3" fill="#222"/></g>
    <g class="avatar-eye"><circle cx="62" cy="50" r="6" fill="#fff"/><circle cx="62" cy="50" r="3" fill="#222"/></g>
    <ellipse cx="50" cy="64" rx="9" ry="6" fill="#222"/>
    <path d="M42 74 Q50 80 58 74" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>
  `;
 
  const accessories = {
    hat: `
      <ellipse cx="50" cy="20" rx="34" ry="6" fill="#c0392b"/>
      <path d="M28 20 Q50 -6 72 20 Z" fill="#c0392b"/>
      <rect x="30" y="14" width="40" height="6" fill="#e74c3c"/>
    `,
    glasses: `
      <rect x="28" y="44" width="18" height="11" rx="4" fill="#222"/>
      <rect x="54" y="44" width="18" height="11" rx="4" fill="#222"/>
      <rect x="46" y="47" width="8" height="3" fill="#222"/>
    `,
    earrings: `
      <circle cx="22" cy="44" r="3.5" fill="#d4af37"/>
      <circle cx="78" cy="44" r="3.5" fill="#d4af37"/>
    `
  };
 
  const avatarPreview   = document.getElementById('avatarPreview');
  const avatarColorInput = document.getElementById('avatarColor');
  const hatToggle      = document.getElementById('acc_hat');
  const glassesToggle  = document.getElementById('acc_glasses');
  const earringsToggle = document.getElementById('acc_earrings');
 
  function renderAvatar() {
    const color = avatarColorInput.value;
 
    let markup = '<svg viewBox="0 0 100 100" width="90" height="90" fill="' + color + '">';
    markup += koalaBase;
    if (earringsToggle.checked) markup += accessories.earrings;
    markup += koalaFace;
    if (glassesToggle.checked) markup += accessories.glasses;
    if (hatToggle.checked) markup += accessories.hat;
    markup += '</svg>';
 
    avatarPreview.innerHTML = markup;
  }
 
  avatarColorInput.addEventListener('input', renderAvatar);
  hatToggle.addEventListener('change', renderAvatar);
  glassesToggle.addEventListener('change', renderAvatar);
  earringsToggle.addEventListener('change', renderAvatar);
 
  renderAvatar();
 
  /* ---------- Age from date of birth ---------- */
  const dobInput  = document.getElementById('dob');
  const ageOutput = document.getElementById('age');
 
  dobInput.addEventListener('change', function () {
    if (!this.value) {
      ageOutput.textContent = '--';
      return;
    }
 
    const dob   = new Date(this.value);
    const today = new Date();
 
    let age = today.getFullYear() - dob.getFullYear();
 
    const hadBirthdayThisYear =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
 
    if (!hadBirthdayThisYear) age--;
 
    ageOutput.textContent = age >= 0 ? age : '--';
  });