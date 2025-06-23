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
    classes: ["A"],
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
    classes: ["A"],
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
    classes: ["A"],
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
    classes: ["A"],
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
    classes: ["A"],
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
    classes: ["A"],
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
    classes: ["A"],
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
    classes: ["A"],
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
    classes: ["A"],
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
    classes: ["A"],
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
    classes: ["A", "B"],
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
    classes: ["A", "B"],
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
