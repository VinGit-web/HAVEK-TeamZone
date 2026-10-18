import { watchMyBlocks, unblockMember } from './safety-firebase.js';

import { animalPreset, svgAvatar } from './avatar-renderer.js';
import { auth, db } from './firebase.js';
import { onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { doc, getDoc, setDoc, writeBatch, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';

const $ = id => document.getElementById(id);

const MBTI = {
  ISTJ: 'Practical, organised and detail-oriented.',
  ISFJ: 'Supportive, thoughtful and dependable.',
  INFJ: 'Reflective, values-driven and insightful.',
  INTJ: 'Independent, strategic and analytical.',
  ISTP: 'Practical, adaptable and observant.',
  ISFP: 'Flexible, gentle and experience-oriented.',
  INFP: 'Imaginative, idealistic and reflective.',
  INTP: 'Curious, analytical and idea-focused.',
  ESTP: 'Action-oriented, adaptable and spontaneous.',
  ESFP: 'Expressive, sociable and experience-oriented.',
  ENFP: 'Enthusiastic, imaginative and possibility-focused.',
  ENTP: 'Exploratory, inventive and debate-oriented.',
  ESTJ: 'Structured, decisive and practical.',
  ESFJ: 'Cooperative, attentive and community-minded.',
  ENFJ: 'Encouraging, people-focused and organised.',
  ENTJ: 'Strategic, decisive and goal-oriented.'
};

const INTERESTS = {
  'Arts & Creativity': ['Art', 'Painting', 'Pottery', 'Photography', 'Music', 'Dance', 'Ballet', 'Drawing', 'Sketching', 'Crafts', 'DIY', 'Sewing', 'Knitting', 'Sculpture', 'Digital Art', 'Graphic Design', 'Creative Writing', 'Singing', 'Playing Instruments', 'Theatre'],
  'Sports & Outdoors': ['Running', 'Walking', 'Hiking', 'Cycling', 'Swimming', 'Yoga', 'Boxing', 'Football', 'Netball', 'Fencing', 'Horse Back Riding', 'Basketball', 'Badminton', 'Tennis', 'Volleyball', 'Pilates', 'Gym', 'Dancing', 'Camping', 'Nature', 'Birdwatching', 'Beach Trips', 'Rock Climbing', 'Skateboarding'],
  'Entertainment & Games': ['Gaming', 'Board Games', 'Chess', 'Anime', 'Movies', 'TV Shows', 'K-pop', 'Concerts', 'Live Music', 'Trivia', 'Puzzles', 'Esports', 'Tabletop RPGs', 'Comics', 'Manga', 'Cosplay'],
  'Learning & Culture': ['Reading', 'Museums', 'History', 'Languages', 'Science', 'Technology', 'Coding', 'Robotics', 'Astronomy', 'Libraries', 'Exhibitions', 'Architecture', 'Literature', 'Workshops'],
  'Food & Social': ['Markets', 'Coffee', 'Eating', 'Cooking', 'Baking', 'Cafés', 'Food Festivals', 'Picnics', 'Community Events', 'Volunteering', 'Brunch', 'Tea'],
  'Lifestyle & Hobbies': ['Gardening', 'Dogs', 'Cats', 'Pets', 'Plants', 'Sustainability', 'Fashion', 'Travel', 'Journaling', 'Meditation', 'Collecting', 'Model Building', 'Aquariums']
};

const ANIMALS = {
  australia: [['koala', 'Koala'], ['kangaroo', 'Kangaroo'], ['wombat', 'Wombat'], ['quokka', 'Quokka'], ['platypus', 'Platypus'], ['kookaburra', 'Kookaburra'], ['echidna', 'Echidna'], ['tasdevil', 'Tasmanian devil'], ['emu', 'Emu']],
  pets: [['dog', 'Dog'], ['cat', 'Cat'], ['rabbit', 'Rabbit'], ['hamster', 'Hamster'], ['guineapig', 'Guinea pig'], ['parrot', 'Parrot']],
  world: [['redpanda', 'Red panda'], ['penguin', 'Penguin'], ['fox', 'Fox'], ['capybara', 'Capybara'], ['panda', 'Panda']]
};

const AVATAR_FIELDS = [
  'characterName', 'primaryColor', 'secondaryColor', 'expression',
  'pattern', 'headwear', 'eyewear', 'earrings', 'neckwear', 'extra',
  'outfit', 'outfitColor', 'trimColor', 'backgroundPreset'
];

let currentUser = null;
let savedProfile = null;
let savedPersona = null;
let ready = false;
let stopBlockedUsers = null;
let avatar = { ...animalPreset('koala') };
let animalCategory = 'australia';

const selectedInterests = new Set();
const PRIVACY_FIELDS = ['age', 'gender', 'mbti', 'interests', 'suburb', 'about'];
const PRIVACY_LABELS = { age: 'Age', gender: 'Gender', mbti: 'MBTI', interests: 'Interests', suburb: 'Suburb / Location', about: 'About Me' };
let savedPublicVisibility = null;
let publicVisibility = Object.fromEntries(PRIVACY_FIELDS.map(field => [field, false]));
function setupPrivacy() {
  const rows = $('privacyFieldRows');
  for (const field of PRIVACY_FIELDS) {
    const row = document.createElement('div'); row.className = 'privacy-field';
    const label = document.createElement('label'); label.htmlFor = `privacy-${field}`; label.textContent = PRIVACY_LABELS[field];
    const select = document.createElement('select'); select.id = `privacy-${field}`;
    select.add(new Option('Private', 'private')); select.add(new Option('Public', 'public'));
    select.addEventListener('change', () => { publicVisibility[field] = select.value === 'public'; });
    row.append(label, select); rows.append(row);
  }
  const setAll = value => { for (const field of PRIVACY_FIELDS) { publicVisibility[field] = value; $(`privacy-${field}`).value = value ? 'public' : 'private'; } };
  $('privacyAllPublic').addEventListener('click', () => setAll(true));
  $('privacyAllPrivate').addEventListener('click', () => setAll(false));
}
function populatePrivacy(data, persona) {
  for (const field of PRIVACY_FIELDS) {
    publicVisibility[field] = data && typeof data[field] === 'boolean' ? data[field] : (field === 'suburb' && persona?.showSuburb === true);
    $(`privacy-${field}`).value = publicVisibility[field] ? 'public' : 'private';
  }
}
function shareableData(profile, persona) {
  return {
    age: profile.birthYear ? new Date().getFullYear() - profile.birthYear : null,
    gender: profile.gender || null,
    mbti: persona.mbti || null,
    interests: [...persona.interests],
    suburb: persona.suburb || null,
    about: persona.persona || null
  };
}


function status(message, error = false) {
  const el = $('accountStatus');
  if (el) {
    el.textContent = message;
    el.style.color = error ? '#a52b22' : '#236c45';
  }
}

function setupMbti() {
  const select = $('mbti');
  if (!select) return;

  Object.keys(MBTI).forEach(type => {
    if (![...select.options].some(o => o.value === type)) {
      select.add(new Option(type, type));
    }
  });

  const describe = () => {
    if ($('accountMbtiDescription')) {
      $('accountMbtiDescription').textContent =
        MBTI[select.value] || 'MBTI is optional.';
    }
  };

  select.addEventListener('change', describe);
  describe();
}

function renderInterests() {
  const container = $('accountInterestOptions');
  if (!container) return;

  const search = ($('accountInterestSearch')?.value || '')
    .trim()
    .toLowerCase();

  container.replaceChildren();

  const known = new Set(Object.values(INTERESTS).flat());
  const previous = [...selectedInterests].filter(i => !known.has(i) && i.toLowerCase().includes(search));
  if (previous.length) {
    const group = document.createElement('div');
    group.className = 'interest-group';
    const title = document.createElement('h3');
    title.textContent = 'Previously selected';
    const options = document.createElement('div');
    options.className = 'interest-group-options';
    previous.forEach(interest => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'interest-chip selected';
      button.dataset.interest = interest;
      button.textContent = interest;
      button.setAttribute('aria-pressed', 'true');
      options.append(button);
    });
    group.append(title, options);
    container.append(group);
  }

  for (const [groupName, interests] of Object.entries(INTERESTS)) {
    const matches = interests.filter(i =>
      i.toLowerCase().includes(search)
    );

    if (!matches.length) continue;

    const group = document.createElement('div');
    group.className = 'interest-group';

    const title = document.createElement('h3');
    title.textContent = groupName;
    group.append(title);

    const options = document.createElement('div');
    options.className = 'interest-group-options';

    matches.forEach(interest => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'interest-chip';
      button.dataset.interest = interest;
      button.textContent = interest;

      button.classList.toggle(
        'selected',
        selectedInterests.has(interest)
      );

      button.setAttribute(
        'aria-pressed',
        String(selectedInterests.has(interest))
      );

      options.append(button);
    });

    group.append(options);
    container.append(group);
  }

  if ($('accountInterestCount')) {
    const count = selectedInterests.size;
    $('accountInterestCount').textContent =
      `${count} interest${count === 1 ? '' : 's'} selected`;
  }
}

function setupInterests() {
  $('accountInterestSearch')?.addEventListener(
    'input',
    renderInterests
  );

  $('accountInterestOptions')?.addEventListener('click', event => {
    const button = event.target.closest('button[data-interest]');
    if (!button) return;

    const interest = button.dataset.interest;

    if (selectedInterests.has(interest)) {
      selectedInterests.delete(interest);
    } else {
      if (selectedInterests.size >= 35) {
        $('accountInterestCount').textContent = 'Maximum 35 interests. Deselect one to add another.';
        return;
      }
      selectedInterests.add(interest);
    }

    renderInterests();
  });

  renderInterests();
}

function renderAvatar() {
  const markup = svgAvatar(avatar);

  if ($('avatarPreview')) {
    $('avatarPreview').innerHTML = markup;
  }

  if ($('profileAvatar')) {
    $('profileAvatar').innerHTML = markup;
  }
}

function renderAnimals() {
  const grid = $('animalGrid');
  if (!grid) return;

  grid.replaceChildren();

  (ANIMALS[animalCategory] || []).forEach(([id, label]) => {
    const button = document.createElement('button');
    button.type = 'button';

    button.classList.toggle('selected', avatar.animal === id);

    const image = document.createElement('span');
    image.innerHTML = svgAvatar(animalPreset(id));

    const name = document.createElement('span');
    name.textContent = label;

    button.append(image, name);

    button.addEventListener('click', () => {
      setAvatar(animalPreset(id));
    });

    grid.append(button);
  });
}

function setAvatar(value) {
  const animal = value?.animal || 'koala';

  avatar = {
    ...animalPreset(animal),
    ...value,
    version: 2,
    mode: 'animal'
  };

  if (value && value.version !== 2) {
    avatar = {
      ...animalPreset(animal),
      primaryColor:
        value.color || animalPreset(animal).primaryColor,
      headwear: value.hat ? 'cap' : 'none',
      eyewear: value.glasses ? 'sunglasses' : 'none',
      earrings: value.earrings ? 'studs' : 'none',
      version: 2,
      mode: 'animal'
    };
  }

  AVATAR_FIELDS.forEach(id => {
    if ($(id)) $(id).value = avatar[id] ?? '';
  });

  animalCategory = Object.keys(ANIMALS).find(key =>
    ANIMALS[key].some(([id]) => id === animal)
  ) || 'australia';

  document.querySelectorAll('[data-category]').forEach(button => {
    button.classList.toggle(
      'selected',
      button.dataset.category === animalCategory
    );
  });

  renderAnimals();
  renderAvatar();
}



function setupAvatar() {
  AVATAR_FIELDS.forEach(id => {
    $(id)?.addEventListener('input', () => {
      avatar[id] = $(id).value;
      renderAvatar();
    });
  });
  
  document.querySelectorAll('[data-category]').forEach(button => {
    button.addEventListener('click', () => {
      animalCategory = button.dataset.category;

      document.querySelectorAll('[data-category]').forEach(b => {
        b.classList.toggle('selected', b === button);
      });

      renderAnimals();
    });
  });

  $('randomAvatar')?.addEventListener('click', () => {
    const allAnimals = Object.values(ANIMALS).flat();

    const randomAnimal =
      allAnimals[Math.floor(Math.random() * allAnimals.length)][0];

    const randomFrom = array =>
      array[Math.floor(Math.random() * array.length)];

   
    const randomSelectValue = id => {
      const select = $(id);
      if (!select || !select.options || select.options.length === 0) {
        return 'none';
      }

      const values = Array.from(select.options).map(option => option.value);
      return randomFrom(values);
    };

    const colours = [
      '#92979c',
      '#d8a48f',
      '#c78f65',
      '#8fa98f',
      '#7d98a1',
      '#b69acb',
      '#e3a6a1',
      '#d6bd78',
      '#91a8d0',
      '#a6c7b7'
    ];

    const randomAvatar = {
      ...animalPreset(randomAnimal),

      version: 2,
      mode: 'animal',
      primaryColor: randomFrom(colours),
      secondaryColor: randomFrom(colours),

      expression: randomSelectValue('expression'),
      pattern: randomSelectValue('pattern'),
      headwear: randomSelectValue('headwear'),
      eyewear: randomSelectValue('eyewear'),
      earrings: randomSelectValue('earrings'),
      neckwear: randomSelectValue('neckwear'),
      extra: randomSelectValue('extra'),
      outfit: randomSelectValue('outfit'),
      outfitColor: randomFrom(colours),
      trimColor: randomFrom(colours),

      backgroundPreset: randomSelectValue('backgroundPreset'),
      characterName: avatar.characterName || ''
    };

    setAvatar(randomAvatar);
  });

  $('resetAvatar')?.addEventListener('click', () => {
    setAvatar(animalPreset(avatar.animal || 'koala'));
  });

  renderAnimals();

 
  if (avatar && avatar.version === 2) {
    setAvatar(avatar);
  } else {
    setAvatar(animalPreset('koala'));
  }
}




function setupTabs() {
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(b => {
        b.classList.toggle('active', b === button);
        b.setAttribute('aria-selected', String(b === button));
      });

      document.querySelectorAll('.account-panel').forEach(panel => {
        panel.hidden =
          panel.id !== `panel-${button.dataset.tab}`;

        panel.classList.toggle('active', !panel.hidden);
      });
    });
  });
}

function setupBirthYears() {
  const select = $('birthYear');
  if (!select) return;

  select.replaceChildren(new Option('Select birth year', ''));

  for (let year = 2008; year >= 1900; year--) {
    select.add(new Option(String(year), String(year)));
  }

  select.addEventListener('change', () => {
    if ($('age')) {
      $('age').textContent = select.value
        ? String(new Date().getFullYear() - Number(select.value))
        : '--';
    }
  });
}

function defaults(user) {
  return {
    uid: user.uid,
    username: user.displayName || '',
    fullName: '',
    birthYear: 0,
    gender: '',
    visibility: 'private',
    showEmail: false,
    allowMessages: true,
    searchVisible: true,
    emailNotifications: true,
    avatar: animalPreset('koala')
  };
}

function populate(profile, persona) {
  $('username').value = profile.username || '';
  $('name').value = profile.fullName || '';
  $('email').value = currentUser?.email || '';

  $('birthYear').value = profile.birthYear
    ? String(profile.birthYear)
    : '';

  $('birthYear').dispatchEvent(new Event('change'));

  $('gender').value = profile.gender || '';
  $('persona').value = persona?.persona || '';
  $('mbti').value = persona?.mbti || '';
  $('mbti').dispatchEvent(new Event('change'));

  selectedInterests.clear();

  (persona?.interests || []).forEach(interest => {
    selectedInterests.add(interest);
  });

  if ($('accountInterestSearch')) {
    $('accountInterestSearch').value = '';
  }

  renderInterests();

  $('suburb').value = persona?.suburb || '';
  $('preference').value = persona?.preference || 'none';
  $('showSuburb').checked = persona?.showSuburb === true;

  const visibility = profile.visibility === 'public'
    ? 'public'
    : 'private';

  const radio = document.querySelector(
    `input[name="visibility"][value="${visibility}"]`
  );

  if (radio) radio.checked = true;

  const checkboxes = [
    ['show_email', 'showEmail', false],
    ['allow_messages', 'allowMessages', true],
    ['search_visible', 'searchVisible', true],
    ['email_notifications', 'emailNotifications', true]
  ];

  for (const [id, field, fallback] of checkboxes) {
    if ($(id)) {
      $(id).checked = typeof profile[field] === 'boolean'
        ? profile[field]
        : fallback;
    }
  }

  setAvatar(profile.avatar || animalPreset('koala'));
}

async function loadAccount(user) {
  if (stopBlockedUsers) { stopBlockedUsers(); stopBlockedUsers = null; }
  if (user) stopBlockedUsers = watchMyBlocks(async (excluded, mine) => {
    const list = $('blockedUsersList'); if (!list) return;
    list.replaceChildren();
    if (!mine.length) { list.textContent = 'You have not blocked anyone.'; return; }
    for (const uid of mine) {
      const row = document.createElement('div'); row.className = 'blocked-user-row';
      const label = document.createElement('span'); label.textContent = uid;
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Unblock';
      button.addEventListener('click', async () => {
        if (!confirm('Unblock this member? Your previous connection will not be restored.')) return;
        button.disabled = true;
        try { await unblockMember(uid); } catch (error) { alert(error.message || 'Unable to unblock.'); button.disabled = false; }
      });
      row.append(label, button); list.append(row);
      getDoc(doc(db, 'publicProfiles', uid)).then(snap => { if (snap.exists()) label.textContent = snap.data().username || uid; }).catch(() => { });
    }
  });
  currentUser = user;
  savedProfile = null;
  savedPersona = null;
  ready = false;

  if ($('saveAccount')) $('saveAccount').disabled = true;

  if (!user) {
    location.replace('login.html');
    return;
  }

  status('Loading profile...');

  try {
    const [privateSnap, personaSnap, visibilitySnap] = await Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDoc(doc(db, 'userPersonas', user.uid)),
      getDoc(doc(db, 'publicDetails', user.uid))
    ]);

    if (auth.currentUser?.uid !== user.uid) return;

    savedProfile = privateSnap.exists()
      ? { ...defaults(user), ...privateSnap.data() }
      : defaults(user);

    savedPersona = personaSnap.exists()
      ? personaSnap.data()
      : null;

    populate(savedProfile, savedPersona);
    savedPublicVisibility = visibilitySnap.exists() ? visibilitySnap.data().visibility : null;
    populatePrivacy(savedPublicVisibility, savedPersona);

    ready = true;
    $('saveAccount').disabled = false;

    status(
      privateSnap.exists()
        ? ''
        : 'Complete your profile and click Save Changes.'
    );

  } catch (error) {
    console.error('Account load failed:', error);
    status(`Load failed: ${error.message}`, true);
  }
}

async function saveAccount(event) {
  event.preventDefault();

  if (!ready || !currentUser || !savedProfile) {
    status('Your account is still loading.', true);
    return;
  }

  const user = currentUser;
  const username = $('username').value.trim();
  const birthYear = Number($('birthYear').value);

  if (!username || username.length > 30) {
    status('Enter a username of up to 30 characters.', true);
    return;
  }

  if (
    !Number.isInteger(birthYear) ||
    birthYear < 1900 ||
    birthYear > 2008
  ) {
    status('Select a valid birth year.', true);
    return;
  }

  if (!$('persona').value || $('persona').value.length > 100) {
    status('Select a valid personality description.', true);
    return;
  }

  if (selectedInterests.size < 1 || selectedInterests.size > 35) {
    status('Select between 1 and 35 interests.', true);
    return;
  }

  const suburb = $('suburb').value.trim();

  if (!suburb || suburb.length > 100) {
    status('Enter a valid suburb or locality.', true);
    return;
  }

  const privateProfile = {
    uid: user.uid,
    username,
    fullName: $('name').value.trim(),
    birthYear,
    gender: $('gender').value,

    visibility: Object.values(publicVisibility).some(Boolean) ? 'public' : 'private',

    showEmail: $('show_email').checked,
    allowMessages: $('allow_messages').checked,
    searchVisible: $('search_visible').checked,
    emailNotifications: $('email_notifications').checked,

    avatar: {
      ...avatar,
      version: 2,
      mode: 'animal'
    },

    createdAt:
      savedProfile.createdAt || serverTimestamp(),

    updatedAt: serverTimestamp()
  };

  const personaProfile = {
    uid: user.uid,
    persona: $('persona').value,
    mbti: $('mbti').value,
    interests: [...selectedInterests],
    suburb,
    state: 'QLD',
    preference: $('preference').value,
    showSuburb: publicVisibility.suburb,

    createdAt:
      savedPersona?.createdAt || serverTimestamp(),

    updatedAt: serverTimestamp()
  };

  const publicProfile = {
    uid: user.uid,
    username,
    avatar: privateProfile.avatar
  };

  const shared = shareableData(privateProfile, personaProfile);
  const publicFields = Object.fromEntries(
    PRIVACY_FIELDS.filter(field => publicVisibility[field]).map(field => [field, shared[field]])
  );
  const button = $('saveAccount'); button.disabled = true;
  try {
    if (auth.currentUser?.uid !== user.uid) throw new Error('Your sign-in session has changed.');
    status('Saving account and privacy settings...');
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', user.uid), privateProfile);
    batch.set(doc(db, 'userPersonas', user.uid), personaProfile);
    batch.set(doc(db, 'publicProfiles', user.uid), publicProfile);
    batch.set(doc(db, 'sharedProfiles', user.uid), { uid: user.uid, ...shared });
    batch.set(doc(db, 'publicDetails', user.uid), { uid: user.uid, visibility: { ...publicVisibility }, fields: publicFields });
    await batch.commit();
    savedProfile = privateProfile; savedPersona = personaProfile; savedPublicVisibility = { ...publicVisibility };
    await updateProfile(user, { displayName: username });
    status('Profile and visibility settings saved.');
  } catch (error) {
    console.error('Account save failed:', error);
    status(`Save failed: ${error.message}`, true);
  } finally { button.disabled = false; }
}

function resetAccount(event) {
  event.preventDefault();

  if (savedProfile) {
    populate(savedProfile, savedPersona);
    populatePrivacy(savedPublicVisibility, savedPersona);
    status('Unsaved changes discarded.');
  }
}

function initialise() {
  setupMbti();
  setupInterests();
  setupAvatar();
  setupTabs();
  setupBirthYears();
  setupPrivacy();
  $('openBlockedUsers')?.addEventListener('click', () => $('blockedUsersSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  $('accountForm').addEventListener('submit', saveAccount);
  $('accountForm').addEventListener('reset', resetAccount);

  $('saveAccount').disabled = true;

  onAuthStateChanged(auth, loadAccount);
}

initialise();
