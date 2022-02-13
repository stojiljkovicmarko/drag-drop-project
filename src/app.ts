enum ProjectStatus {
  Active,
  Finished,
}

// Model for our project
class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {
    this.title = title;
    this.description = description;
    this.people = people;
  }
}

type Listener<T> = (items: T[]) => void;

// State base class with listeners and method to add them
class State<T> {
  protected listeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

// State with singleton pattern where we store listeneres and projects
class ProjectState extends State<Project> {
  private projects: any[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.floor(Math.random() * (100000 - 10000) + 100000).toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    for (const listenersFn of this.listeners) {
      listenersFn(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance();

// Interface for validation
interface Validatable {
  value: string | number;
  required?: boolean;
  maxLength?: number;
  minLenght?: number;
  min?: number;
  max?: number;
}

//function that validates input based on parameteres passed
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

// Component base class for project list and input
// component for UI / generic to set concrete types for props
//this class (abstract) should not be instatiated its only to inherit from
abstract class ProjectComponent<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;

    //importNode(externalNode, deep) => 1. node to import, 2. all nested tags

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      this.element.id = newElementId;
    }

    this.attach(insertAtStart);
  }

  //insertAdjElement(position, element) - position relative to the element it is invoked upon
  //4 options all strings: beforebegin, afterbegin, beforeend, afterend
  private attach(insertAtStart: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtStart ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

// ProjectList class
class ProjectList extends ProjectComponent<HTMLDivElement, HTMLElement> {
  assignedProjects: Project[];

  constructor(private listType: "active" | "finished") {
    super("project-list", "app", false, `${listType}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  renderContent() {
    const listId = `${this.listType}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector(
      "h2"
    )!.innerHTML = `${this.listType.toUpperCase()} PROJECTS`;
  }

  configure(): void {
    //manage listeners for actions
    projectState.addListener((projects: Project[]) => {
      const filteredProjects = projects.filter((project) => {
        if (this.listType === "active") {
          return project.status === ProjectStatus.Active;
        }
        return project.status === ProjectStatus.Finished;
      });
      this.assignedProjects = filteredProjects;
      this.renderProjects();
    });
  }

  private renderProjects() {
    const listElem = document.getElementById(
      `${this.listType}-projects-list`
    )! as HTMLUListElement;
    listElem.innerHTML = "";
    for (const projItem of this.assignedProjects) {
      const listItem = document.createElement("li");
      listItem.textContent = projItem.title;
      listElem.appendChild(listItem);
    }
  }
}

// Project input class
class ProjectInput extends ProjectComponent<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, "user-input");

    this.titleInputElement = this.element.querySelector(
      "#title"
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      "#people"
    ) as HTMLInputElement;

    this.configure();
    this.renderContent();
  }

  configure() {
    this.element.addEventListener("submit", this.submitHandler);
  }

  renderContent(): void {}

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
      minLenght: 6,
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
      projectState.addProject(title, desc, people);
      this.clearUserInput();
    }
  }
}

const projectInput = new ProjectInput();

const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");
