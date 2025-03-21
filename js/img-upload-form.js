import {isEscapeKey} from './utils.js';
import {addListeners, removeListeners} from './img-editor.js';


const REGEX_VALID_HASHTAG = /^#[a-zа-яё0-9]{1,19}$/i;
const TextErrors = {
  DESCRIPTION_LENGTH: 'Длина комментария не может составлять больше 140 символов',
  HASHTAG_COUNT: 'Нельзя использовать более 5 хештегов',
  HASHTAG_DUPLICATE: 'Один и тот же хэштег не может быть использован дважды',
  HASHTAG_INVALID: 'Невалидный хештег'
};
const HASHTAG_LENGTH = 5;
const DESCRIPTION_LENGTH = 140;

const body = document.querySelector('body');
const form = document.querySelector('.img-upload__form'); // Форма загрузки нового изображения на сайт
const inputUpload = form.querySelector('.img-upload__input'); // Поле загрузки нового изображения (выбора файла)
const formOverlay = form.querySelector('.img-upload__overlay'); // Форма редактирования изображения
const buttonCancel = form.querySelector('.img-upload__cancel'); // Кнопка для закрытия формы редактирования изображения
const inputHashtags = form.querySelector('.text__hashtags'); // Поле ввода хэштегов
const inputDescription = form.querySelector('.text__description'); // Поле ввода описания фотографии

let textHashtagError = '';

// Функция открытия формы редактирования изображения
const inputUploadChangeHandler = () => {
  document.addEventListener('keydown', onDocumentKeydown);
  addListeners();
  formOverlay.classList.remove('hidden');
  body.classList.add('modal-open');
};

// Функция закрытия формы редактирования изображения
const buttonCancelClickHandler = () => {
  document.removeEventListener('keydown', onDocumentKeydown);
  removeListeners();
  formOverlay.classList.add('hidden');
  body.classList.remove('modal-open');
  inputUpload.value = '';
  inputHashtags.value = '';
  inputDescription.value = '';
};

// Отслеживание загрузки изображения в поле
inputUpload.addEventListener('change', inputUploadChangeHandler);

// Отслеживание клика по кнопке закрытия формы
buttonCancel.addEventListener('click', buttonCancelClickHandler);

// Отслеживание клика по escape
function onDocumentKeydown (evt) {
  if (isEscapeKey(evt)) {
    evt.preventDefault();
    buttonCancelClickHandler();
  }
}


// Настройка библиотеки на форму
const pristine = new Pristine(form, {
  classTo: 'img-upload__field-wrapper',
  errorClass: 'img-upload__field-wrapper--error',
  errorTextParent: 'img-upload__field-wrapper',
  errorTextTag: 'p'
});

// Функция проверки поля комментариев
const validateInputDescription = (value) => value.length <= DESCRIPTION_LENGTH;

// Добавление валидатора для поля описания фотографии (комментария))
pristine.addValidator(
  inputDescription,
  validateInputDescription,
  TextErrors.DESCRIPTION_LENGTH
);

// Коллбек, останавливающий всплытие события нажатия кнопки Esc
const inputKeydownHandler = (evt) => {
  if (isEscapeKey(evt)) {
    evt.stopPropagation();
  }
};

// Добавление слушателя события нажатия клавиш внутри полей описания фотографии и добавления хештегов
inputDescription.addEventListener('keydown', inputKeydownHandler);
inputHashtags.addEventListener('keydown', inputKeydownHandler);


// Функция валидации поля хештегов
const validateInputHashtags = (value) => {
  const hashtags = value.split(' ');

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

// Добавление валидатора для поля ввода хештегов
pristine.addValidator(
  inputHashtags,
  validateInputHashtags,
  getHashtagErrorMessage
);

// Функция валидации и отправки формы
const formSubmitHandler = (evt) => {
  evt.preventDefault();

  const isValid = pristine.validate();
  if (isValid) {
    evt.target.submit();
  }
};

// Добавление слушателя события отправки формы
form.addEventListener('submit', formSubmitHandler);
