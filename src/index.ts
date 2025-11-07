import { createDistributionCharts } from "./featureChart";
import { DataInterface } from "./types";
//Note: It takes some time to load the data, this is not immediatly filled.
let data: DataInterface[];

startUp();
async function startUp(): Promise<void> {
  //Wait for the data to be loaded. Required as loading from a file is asynchronous.
  data = await loadCSVTypeScript();
  //Put any data preprocessing code here. Data will be loaded. 
  createDistributionCharts(data);
}


//Loads the CSV file and parses it into a structured format.
async function loadCSVTypeScript(): Promise<DataInterface[]> {
  try {
    //Note: The example dataset are not properly preprocessed, but used to illustrate the data and let you know if everything is setup up correctly.
    const response: Response = await fetch('./data/dataSnippet.csv'); 
    if (!response.ok) throw new Error('Could not load in the data.');

    const csvText: string = await response.text();


    const lines: string[] = csvText.trim().split('\n');
    const values: DataInterface[] = [];
    //start at 1 to skip header rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells: string[] = line.split(',');

      //load in the data into a type such that it is easier to understand. 
      const element: DataInterface = { //TODO: Update this to match your data structure.
        postCode: Number(cells[0]),
        inhabitants: Number(cells[1]),
        maleInhabitants: Number(cells[2]),
        femaleInhabitants: Number(cells[3])
      }
      //check for errors in parsing.
      if(isNaN(element.postCode) || isNaN(element.inhabitants) || isNaN(element.maleInhabitants) || isNaN(element.femaleInhabitants)) {
        console.error(`Invalid data in line ${i + 1}: ${line}`);
      }
      values.push(element);
    }
    return values;
  } catch (error) {
    console.error('Error loading CSV:', error);
    return [];
  }
}


