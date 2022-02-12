// Interface for validation
interface Validatable {
  value: string | number;
  required?: boolean;
  maxLength?: number;
  minLenght?: number;
  min?: number;
  max?: number;
}

function validate(inputToValidate: Validatable) {
  let isValid = true;
  if (inputToValidate.required) {
    isValid = isValid && inputToValidate.value.toString().trim().length !== 0;
  }
  if (
    inputToValidate.minLenght != null &&
    typeof inputToValidate.value === "string"
  ) {
    isValid =
      isValid && inputToValidate.value.length >= inputToValidate.minLenght;
  }
  if (
    inputToValidate.maxLength != null &&
    typeof inputToValidate.value == "string"
  ) {
    isValid =
      isValid && inputToValidate.value.length <= inputToValidate.maxLength;
  }
  if (
    inputToValidate.min != null &&
    typeof inputToValidate.value === "number"
  ) {
    isValid = isValid && inputToValidate.value >= inputToValidate.min;
  }
  if (
    inputToValidate.max != null &&
    typeof inputToValidate.value === "number"
  ) {
    isValid = isValid && inputToValidate.value <= inputToValidate.max;
  }
  return isValid;
}

// Decorator: autobind
//target: any - prototype of the object we work with
//cause we add it to the instance method
//methodName: string - to which we are adding the decorator
//descriptor: PropertyDescriptor - methods property value is a pointer to the function
//we get the value and bind this, which is always the calling object and not the event
//we change the accessor descriptor

function autobind(
  _target: any,
  _methodName: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const editedDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: false,
    get() {
      const newFn = originalMethod.bind(this);
      return newFn;
    },
  };
  return editedDescriptor;
}

// Project input class
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  formElement: HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = document.getElementById(
      "project-input"
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;

    const importedNodeForm = document.importNode(
      this.templateElement.content,
      true
    );

    this.formElement = importedNodeForm.firstElementChild as HTMLFormElement;
    this.formElement.id = "user-input";

    this.titleInputElement = this.formElement.querySelector(
      "#title"
    ) as HTMLInputElement;
    this.descriptionInputElement = this.formElement.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInputElement = this.formElement.querySelector(
      "#people"
    ) as HTMLInputElement;

    this.configureForm();
    this.attach();
  }

  private attach() {
    this.hostElement.insertAdjacentElement("afterbegin", this.formElement);
  }

  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
      minLenght: 5,
    };
    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLenght: 10,
    };
    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
    };

    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert("Invalid input, please try again.");
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  private clearUserInput(): void {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const gatheredInputValues = this.gatherUserInput();
    if (Array.isArray(gatheredInputValues)) {
      const [title, desc, people] = gatheredInputValues;
      console.log(title, desc, people);
      this.clearUserInput();
    }
  }

  private configureForm() {
    this.formElement.addEventListener("submit", this.submitHandler);
  }
}

const projectInput = new ProjectInput();
