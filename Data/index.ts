export const standards = {
  "KG1":{
    classes:["Dhruv"],
    subjects:[
      "demo1"
    ]
  },
  "KG2":{
    classes:["Dhruv"],
    subjects:[
      "demo1"
    ]
  },
  "1": {
    classes: ["Dhruv", "Nachiketa","Prahlad","Nambi"],
    subjects: [
      "Gujarati",
      "Mathematics",
      "English",
      "Hindi",
      "General Knowledge",

      "Computer",
    ],
  },
  "2": {
    classes: ["Dhruv", "Nachiketa","Prahlad","Nambi"],
    subjects: [
      "Gujarati",
      "Mathematics",
      "English",
      "Hindi",
      "General Knowledge",
      "Computer",
    ],
  },
  "3": {
    classes: ["Dhruv", "Nachiketa", "Prahlad","Nambi"],
    subjects: [
      "Gujarati",
      "Mathematics",
      "English",
      "Hindi",
      "General Knowledge",
      "Computer",
      "Enviornment",
    ],
  },
  "4": {
    classes: ["Dhruv", "Nachiketa", "Prahlad","Nambi"],
    subjects: [
      "Gujarati",
      "Mathematics",
      "English",
      "Hindi",
      "General Knowledge",
      "Computer",
      "Enviornment",
    ],
  },
  "5": {
    classes: ["Dhruv", "Nachiketa", "Prahlad","Nambi"],

    subjects: [
      "Gujarati",
      "Mathematics",
      "English",
      "Hindi",
      "General Knowledge",
      "Computer",
      "Enviornment",
    ],
  },
  "6": {
    classes: ["Dhruv", "Nachiketa", "Prahlad","Nambi"],
    subjects: [
      "Mathematics",
      "Science",
      "Hindi",
      "Gujarati",
      "Sanskrit",
      "English",
      "Social Science",
      " G.k",
      "Geeta",
      "Computer",
    ],
  },
  "7": {
    classes: ["Dhruv", "Nachiketa", "Prahlad","Nambi"],
    subjects: [
      "Mathematics",
      "Science",
      "Hindi",
      "Gujarati",
      "Sanskrit",
      "English",
      "Social Science",
      " G.k",
      "Geeta",
      "Computer",
    ],
  },
  "8": {
    classes: ["Dhruv", "Nachiketa", "Prahlad","Nambi","Foundation"],
    subjects: [
      "Mathematics",
      "Science",
      "Hindi",
      "Gujarati",
      "Sanskrit",
      "English",
      "Social Science",
      " G.k",
      "Geeta",
      "Computer",
    ],
  },
  "9": {
    classes: ["Dhruv", "Nachiketa", "Prahlad", "Foundation"],
    subjects: [
      "Hindi",
      "Sanskrit",
      "Maths",
      "Science",
      "Gujarati",
      "Social Science",
      "English",
    ],
  },
  "10": {
    classes: ["Dhruv", "Nchiketa","Prahlad"],
    subjects: [
      "Sanskrit",
      "Maths",
      "Science",
      "Gujarati",
      "Social Science",
      "English",
    ],
  },
  "11": {
    classes: ["Maths", "Biology", "Jee", "Neet", "Eng-Jee", "Eng-Neet"],
    subjects: [
      "Chemistry ",
      "Physics",
      "Maths ",
      "Biology",
      "English ",
      "Computer",
      "Sanskrit",
    ],
  },
  "12": {
    classes: ["Maths", "Biology", "Jee", "Neet", "Eng-Jee", "Eng-Neet"],
    subjects: [
      "Chemistry ",
      "Physics",
      "Maths ",
      "Biology",
      "English ",
      "Computer",
      "Sanskrit",
    ],
  },
} as const;

export type StandardKey = keyof typeof standards;
export type ClassData = (typeof standards)[StandardKey];
export type Subject = (typeof standards)[StandardKey];
