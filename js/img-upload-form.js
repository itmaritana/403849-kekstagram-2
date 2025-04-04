import {isEscapeKey} from './utils.js';
import {addListeners, removeListeners} from './img-editor.js';
import {sendData} from './api.js';

const REGEX_VALID_HASHTAG = /^#[a-zа-яё0-9]{1,19}$/i;
const HASHTAG_LENGTH = 5;
const DESCRIPTION_LENGTH = 140;

const TextErrors = {
  DESCRIPTION_LENGTH: 'Длина комментария не может составлять больше 140 символов',
  HASHTAG_COUNT: 'Нельзя использовать более 5 хештегов',
  HASHTAG_DUPLICATE: 'Один и тот же хэштег не может быть использован дважды',
  HASHTAG_INVALID: 'Невалидный хештег'
};

const FILE_TYPES = ['jpg', 'jpeg', 'png'];

const body = document.querySelector('body');
const form = document.querySelector('.img-upload__form'); // Форма загрузки нового изображения на сайт
const inputUpload = form.querySelector('.img-upload__input'); // Поле загрузки нового изображения (выбора файла)
const buttonSubmit = form.querySelector('.img-upload__submit');
const imgPreview = form.querySelector('.img-upload__preview img'); // Предварительный просмотр фотографии
const formOverlay = form.querySelector('.img-upload__overlay'); // Форма редактирования изображения
const buttonCancel = form.querySelector('.img-upload__cancel'); // Кнопка для закрытия формы редактирования изображения
const inputHashtags = form.querySelector('.text__hashtags'); // Поле ввода хэштегов
const inputDescription = form.querySelector('.text__description'); // Поле ввода описания фотографии
const effectsPreviews = form.querySelectorAll('.effects__preview');

let textHashtagError = '';
let pristine;

// Функция проверки поля комментариев
const validateInputDescription = (value) => value.length <= DESCRIPTION_LENGTH;

// Функция валидации поля хештегов
const validateInputHashtags = (value) => {
  const hashtags = value.split(' ').filter((item) => item.length).map((item) => item.toLowerCase());

  if (!value.length) {
    return true;
  }

  if (hashtags.length > HASHTAG_LENGTH) {
    textHashtagError = TextErrors.HASHTAG_COUNT;
    return false;
  }

  const hashtagsSet = new Set(hashtags);

  if (hashtagsSet.size < hashtags.length) {
    textHashtagError = TextErrors.HASHTAG_DUPLICATE;
    return false;
  }

  const isHashtagsValid = hashtags.every((item) => REGEX_VALID_HASHTAG.test(item));

  if (!isHashtagsValid) {
    textHashtagError = TextErrors.HASHTAG_INVALID;
    return false;
  }

  return true;
};

// Функция передачи сообщения об ошибке
const getHashtagErrorMessage = () => textHashtagError;

const initializeValidator = () => {
  // Настройка библиотеки на форму
  pristine = new Pristine(form, {
    classTo: 'img-upload__field-wrapper',
    errorClass: 'img-upload__field-wrapper--error',
    errorTextParent: 'img-upload__field-wrapper',
    errorTextTag: 'p'
  });
  // Добавление валидатора для поля описания фотографии (комментария))
  pristine.addValidator(
    inputDescription,
    validateInputDescription,
    TextErrors.DESCRIPTION_LENGTH
  );
  // Добавление валидатора для поля ввода хештегов
  pristine.addValidator(
    inputHashtags,
    validateInputHashtags,
    getHashtagErrorMessage
  );
};

// Функция открытия формы редактирования изображения
const inputUploadChangeHandler = () => {
  initializeValidator();
  document.addEventListener('keydown', elKeydownHandler);
  addListeners();
  formOverlay.classList.remove('hidden');
  body.classList.add('modal-open');
  const file = inputUpload.files[0];
  const fileName = file.name.toLowerCase();
  const matches = FILE_TYPES.some((type) => fileName.endsWith(type));
  if (matches) {
    imgPreview.src = URL.createObjectURL(file);
    effectsPreviews.forEach((item) => {
      item.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
    });
  }
};

// Функция закрытия формы редактирования изображения
const buttonCancelClickHandler = () => {
  document.removeEventListener('keydown', elKeydownHandler);
  removeListeners();
  formOverlay.classList.add('hidden');
  body.classList.remove('modal-open');
  inputUpload.value = '';
  inputHashtags.value = '';
  inputDescription.value = '';
  form.querySelector('#effect-none').checked = true;
  pristine.destroy();
};

// Отслеживание загрузки изображения в поле
inputUpload.addEventListener('change', inputUploadChangeHandler);

// Отслеживание клика по кнопке закрытия формы
buttonCancel.addEventListener('click', buttonCancelClickHandler);

// Отслеживание клика по escape
function elKeydownHandler (evt) {
  if (isEscapeKey(evt)) {
    evt.preventDefault();
    buttonCancelClickHandler();
  }
}

// Коллбек, останавливающий всплытие события нажатия кнопки Esc
const inputKeydownHandler = (evt) => {
  if (isEscapeKey(evt)) {
    evt.stopPropagation();
  }
};

// Добавление слушателя события нажатия клавиш внутри полей описания фотографии и добавления хештегов
inputDescription.addEventListener('keydown', inputKeydownHandler);
inputHashtags.addEventListener('keydown', inputKeydownHandler);

// Если форма отправлена успешно

const buttonSuccessClickHandler = () => {
  document.querySelector('.success').remove();
  document.removeEventListener('keydown', documentSuccessKeydownHandler);
};

function documentSuccessKeydownHandler (evt) {
  if (isEscapeKey(evt)) {
    evt.preventDefault();
    buttonSuccessClickHandler();
  }
}

function successTextClickHandler (evt) {
  if (evt.target.classList.contains('success')) {
    buttonSuccessClickHandler();
  }
}

const showSuccessMessage = () => {
  const successTemplate = document.querySelector('#success').content.querySelector('.success');
  const successText = successTemplate.cloneNode(true);
  const buttonSuccess = successText.querySelector('.success__button');
  buttonSuccess.addEventListener('click', buttonSuccessClickHandler);
  document.addEventListener('keydown', documentSuccessKeydownHandler);
  successText.addEventListener('click', successTextClickHandler);
  body.append(successText);
};

// Если форма отправлена с ошибкой

const buttonErrorClickHandler = () => {
  document.querySelector('.error').remove();
  document.removeEventListener('keydown', elErrorKeydownHandler);
  document.addEventListener('keydown', elKeydownHandler);
};

function elErrorKeydownHandler (evt) {
  if (isEscapeKey(evt)) {
    evt.preventDefault();
    buttonErrorClickHandler();
  }
}

function errorTextClickHandler (evt) {
  if (evt.target.classList.contains('error')) {
    buttonErrorClickHandler();
  }
}

const showErrorMessage = () => {
  const errorTemplate = document.querySelector('#error').content.querySelector('.error');
  const errorText = errorTemplate.cloneNode(true);
  const buttonError = errorText.querySelector('.error__button');
  buttonError.addEventListener('click', buttonErrorClickHandler);
  document.removeEventListener('keydown', elKeydownHandler);
  document.addEventListener('keydown', elErrorKeydownHandler);
  errorText.addEventListener('click', errorTextClickHandler);
  body.append(errorText);
  buttonSubmit.disabled = false;
};

// Функция валидации и отправки формы
const formSubmitHandler = (evt) => {
  evt.preventDefault();

  const isValid = pristine.validate();
  if (isValid) {
    buttonSubmit.disabled = true;
    sendData(form).then(() => {
      buttonCancelClickHandler();
      showSuccessMessage();
      buttonSubmit.disabled = false;
    })
      .catch(showErrorMessage);
  }
};

// Добавление слушателя события отправки формы
form.addEventListener('submit', formSubmitHandler);
