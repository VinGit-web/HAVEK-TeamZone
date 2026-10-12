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
 
  c
/* ---------- Avatar and photo options ---------- */

const avatarPreview = document.getElementById('avatarPreview');
const avatarColorInput = document.getElementById('avatarColor');
const animalType = document.getElementById('animalType');

const hatToggle = document.getElementById('acc_hat');
const glassesToggle = document.getElementById('acc_glasses');
const earringsToggle = document.getElementById('acc_earrings');

const chooseAvatarButton = document.getElementById('choose-avatar');
const choosePhotoButton = document.getElementById('choose-photo');

const animalOptions = document.getElementById('animal-options');
const photoOptions = document.getElementById('photo-options');

const profilePhoto = document.getElementById('profilePhoto');
const removePhotoButton = document.getElementById('remove-photo');
const photoMessage = document.getElementById('photo-message');

let uploadedPhotoURL = null;
let selectedMode = 'animal';


/* Draw a simple animal avatar */
function renderAvatar() {
  if (selectedMode !== 'animal') return;

  const color = avatarColorInput.value;
  const animal = animalType.value;

  // Keep your original koala design
  if (animal === 'koala') {
    let markup =
      '<svg viewBox="0 0 100 100" width="100" height="100" ' +
      'fill="' + color + '" role="img" aria-label="Koala avatar">';

    markup += koalaBase;

    if (earringsToggle.checked) {
      markup += accessories.earrings;
    }

    markup += koalaFace;

    if (glassesToggle.checked) {
      markup += accessories.glasses;
    }

    if (hatToggle.checked) {
      markup += accessories.hat;
    }

    markup += '</svg>';

    avatarPreview.innerHTML = markup;
    return;
  }

  // Other animal choices use simple illustrated emoji avatars
  const animals = {
    cat: '🐱',
    dog: '🐶',
    rabbit: '🐰'
  };

  avatarPreview.innerHTML = '';

  const animalImage = document.createElement('span');
  animalImage.textContent = animals[animal];
  animalImage.style.fontSize = '76px';
  animalImage.setAttribute('role', 'img');
  animalImage.setAttribute('aria-label', animal + ' avatar');

  avatarPreview.appendChild(animalImage);
}


/* Switch to animal customisation */
chooseAvatarButton.addEventListener('click', function () {
  selectedMode = 'animal';

  animalOptions.hidden = false;
  photoOptions.hidden = true;
  photoMessage.textContent = '';

  renderAvatar();
});


/* Switch to photo upload */
choosePhotoButton.addEventListener('click', function () {
  selectedMode = 'photo';

  animalOptions.hidden = true;
  photoOptions.hidden = false;

  if (uploadedPhotoURL) {
    showUploadedPhoto();
  } else {
    avatarPreview.innerHTML = '';
    photoMessage.textContent = 'Choose an image from your device.';
  }
});


/* Preview the uploaded photo */
profilePhoto.addEventListener('change', function () {
  const file = this.files[0];

  if (!file) return;

  // Only accept image files
  if (!file.type.startsWith('image/')) {
    photoMessage.textContent = 'Please select a valid image.';
    this.value = '';
    return;
  }

  // Release the previous temporary image URL
  if (uploadedPhotoURL) {
    URL.revokeObjectURL(uploadedPhotoURL);
  }

  uploadedPhotoURL = URL.createObjectURL(file);

  selectedMode = 'photo';
  animalOptions.hidden = true;
  photoOptions.hidden = false;

  showUploadedPhoto();
});


/* Display the selected photo */
function showUploadedPhoto() {
  avatarPreview.innerHTML = '';

  const image = document.createElement('img');
  image.src = uploadedPhotoURL;
  image.alt = 'Your uploaded profile picture';

  image.style.width = '100px';
  image.style.height = '100px';
  image.style.objectFit = 'cover';
  image.style.borderRadius = '50%';

  avatarPreview.appendChild(image);
  photoMessage.textContent = 'Photo preview updated.';
}


/* Remove the uploaded photo */
removePhotoButton.addEventListener('click', function () {
  if (uploadedPhotoURL) {
    URL.revokeObjectURL(uploadedPhotoURL);
    uploadedPhotoURL = null;
  }

  profilePhoto.value = '';
  avatarPreview.innerHTML = '';
  photoMessage.textContent = 'Photo removed. Choose an animal avatar or upload another photo.';
});


/* Update the avatar when customisation changes */
avatarColorInput.addEventListener('input', renderAvatar);
animalType.addEventListener('change', renderAvatar);
hatToggle.addEventListener('change', renderAvatar);
glassesToggle.addEventListener('change', renderAvatar);
earringsToggle.addEventListener('change', renderAvatar);


/* Show the default koala */
renderAvatar();

 
  
/* ---------- Year of birth dropdown and age check ---------- */
const birthYearInput = document.getElementById('birthYear');
const ageOutput = document.getElementById('age');
const ageError = document.getElementById('age-error');

const currentYear = new Date().getFullYear();
const latestBirthYear = currentYear - 18;

// Add years from the latest eligible year down to 1950
for (let year = latestBirthYear; year >= 1950; year--) {
  const option = document.createElement('option');
  option.value = year;
  option.textContent = year;
  birthYearInput.appendChild(option);
}

birthYearInput.addEventListener('change', function () {
  const birthYear = Number(this.value);

  if (this.value === '') {
    ageOutput.textContent = '--';
    ageError.style.display = 'none';
    return;
  }

  const age = currentYear - birthYear;

  if (age < 18 || birthYear < 1950) {
    ageOutput.textContent = '--';
    ageError.style.display = 'block';
    this.value = '';
    return;
  }

  ageOutput.textContent = age;
  ageError.style.display = 'none';
});
