"use strict";

const Q = (arg) => document.querySelector(arg);
const Qs = (arg) => document.querySelectorAll(arg);

/**
 *
 * @param {array} idsArray an array of ids of input[type=text]--- source of data 
 * @param {Set} dataset a set object which stores data 
 * @param {string} className class name used to select the element
 * @param {string} targetID id of the element to which view template will be added
 * @returns {object} CRUD provides CRUD ability to manage data 
 *
 */

function CRUD(idsArray, dataset, className, targetID) {

  //validate elements
	
  const isInput = (arg) => arg["tagName"] == "INPUT";
  const isCheckbox = (arg) => isInput(arg) ? (arg["type"] == "checkbox") : false;
  const isInputChecked = (arg) => isCheckbox(arg) ? (arg["checked"] == true) : false;
  const isSpan = (arg) => arg["tagName"] == "SPAN";
  const isDiv = (arg) => arg["tagName"] == "DIV";

  //validates data
	
  const isArray = (arg) => arg instanceof Array;
  const isObjectsArray = (arg) => isArray(arg) ? arg.every((val) => val != null && val != undefined && val instanceof Object) : false;
  const isObject = (arg) => arg instanceof Object && arg !== null && arg !== undefined;
  const isSetObject = (arg) => arg instanceof Set;

  //compares data
	
  const areObjectsEqual = (obj1, obj2) => Object.entries(obj1).toString() == Object.entries(obj2).toString();

  /**
   *
   * CONSTRUCTOR
   * @description initializes CRUD properties
   *
   */

  this.idsArray = idsArray;
  this.dataset = dataset;
  this.className = className;
  this.targetID = targetID;

  /**
   *
   * @description deleteItem function deletes the sourceData from the targetDataset   *
   * @param {String | Object} sourceData
   * @param {Set} targetDataset
   * @returns {Set} the dataset after removing an item
   *
   */

  const deleteItem = (sourceData, targetDataset) => {
    let isExist = 0;
    targetDataset.forEach((targetData) => {
      if (areObjectsEqual(sourceData, targetData)) {
        targetDataset.delete(targetData)
        isExist++
        console.log(`${sourceData} has been deleted from the ${targetDataset}`);
      }
    });
    isExist > 0 ? null : console.log(`${sourceData} is not found in the ${targetDataset}`);
  }

  /**
   *
   * @description UPDATE SET ENTRIES
   * @param {any} oldVal old value to be updated
   * @param {any} newVal new value to be placed in place of old value
   * @param {Set} dataset the dataset to which data need to be updated
   * @returns {Set} updated dataset object
   *
   */

  const updateDataset = (oldVal, newVal, dataset) => {
    let tempDataset = [...dataset];
    dataset.clear();
    tempDataset.forEach((val, ind) => {
      let updatedVal = val;
      if (areObjectsEqual(val, oldVal)) {
        updatedVal = newVal;
        console.log(`${oldVal} has been updated with ${newVal}`);
      } else {
        updatedVal = val;
        console.log(`${newVal} does not exist in the ${dataset}`);
      }
      dataset.add(updatedVal);
    });
  };

  /**
   *
   * @description extracts values from idsArray
   * @returns {string | object} idsData
   *
   */

  this.pullIdsData = () => {
    let idsData;
    if (isArray(this.idsArray) && this.idsArray.length > 1) {
      let objData = {};
      this.idsArray.forEach((id) => {
        id = id[0] == "#" ? id : `#${id}`;
        if (Q(id).value.length > 0) {
          objData[Q(id).name] = Q(id).value;
        }
      });
      idsData = objData;
    } else {
      idsData = Q(this.idsArray).value;
    }
    return idsData;
  }

  /**
   *
   * @description Validates newItem and adds it to the dataset if it is unique.
   *
   */

  this.addItem = (newItem) => {
    let item = newItem || this.pullIdsData();
    if (item.length > 0 || Object.keys(item).length > 0) {
      if (isSetObject(this.dataset)) {
        let isExist = 0;
        this.dataset.forEach((obj) => {
          if (areObjectsEqual(obj, item)) {
            isExist += 1;
          }
        });

        if (isExist == 0) {
          this.dataset.add(item);
          this.injectTemplate();
          console.log(`${item} has been added to the ${this.dataset}`);
        } else {
          console.log(`${item} is already in the ${this.dataset}`);
        }
      } else {
        console.log(`${this.dataset} must be a set object.`);
      }
    } else {
      console.warn(`Data is empty.`)
    }
  }

  /**
   *
   * @description this depends on the template produced by createMultiselectables 
   * @param {HTML element} element checkbox element whose checked property is true.
   * @returns {string | object}
   *
   */

  this.pullData = (element) => {
    let children = element.parentElement.children.length;
    let sourceData = "";
    let returnObj = {};
    element.parentElement.childNodes.forEach((span) => {
      if (isSpan(span)) {
        /* more than two children */
        if (children > 3) {
          returnObj[span.title] = span.innerText;
        }
        /* two children */
        if (children == 3) {
          sourceData = span.innerText;
        }
      }
    });
    return (Object.keys(returnObj).length > 0 && sourceData.length == 0) ? returnObj : sourceData;
  }

  /**
   *
   * @returns {Array<string|object>} returnedObjArr an array of selected items 
   *
   */

  this.pullSelectedDataArray = () => {
    let returnedObjArr = [];
    Qs(`.${this.className}`).forEach((div) => {
      let isChecked = false;
      div.childNodes.forEach((el) => {
        if (isInputChecked(el)) {
          isChecked = true;
          returnedObjArr.push(this.pullData(el));
        }
      });
    });
    return returnedObjArr;
  }

  /**
   * 
   * @description deletes {Array} itemsArr multiple items from dataset 
   *
   */

  this.deleteItems = () => {
    let itemsArr = this.pullSelectedDataArray();
    isArray(itemsArr) ? itemsArr.forEach((item) => deleteItem(item, this.dataset)) : deleteItem(itemsArr, this.dataset);
    this.injectTemplate();
  }

  /**
   *
   * @description sets the eventlisteners for each checkboxes and their span element, update and delete buttons
   *
   */

  this.setEventListeners = () => {
    Qs(`.${this.className} > input[type=checkbox]`).forEach((el) => {
      let isChecked = false;
      el.parentElement.style.backgroundColor = "inherit";
	    
      //toggles span's contenteditable property and update & delete buttons' display property
	    
      el.onclick = () => {
        isChecked = !isChecked;
        el.parentElement.lastElementChild.style.display = isChecked ? "block" : "none";
        el.parentElement.style.backgroundColor = isChecked ? "#f0f0f0" : "inherit";
	      
        //toggling of contenteditable property of span element if the item is selected
	      
        el.parentElement.childNodes.forEach((span) => {

          if (isSpan(span)) {
            let contentEditable = `background-color:#fcfcfc;`;
            let contentNotEditable = `background-color:inherit;`;
            span.contentEditable = false;
            span.style = contentNotEditable;
		  
            //on clicking span element, span innner text turns editable 
		  
            span.onclick = () => {
              if (isChecked) {
                span.contentEditable = true;
                span.style = contentEditable;
              } else {
                span.contentEditable = false;
                span.style = contentNotEditable;
              }
            }
	    
            //on double clicking span element, span innner text turns uneditable
	    
            span.ondblclick = () => {
              span.contentEditable = false;
              span.style = contentNotEditable;
            }
          }
        });

        //setting onclick eventlisteners for each update and delete buttons
	      
        let oldData = this.pullData(el);
        el.parentElement.lastElementChild.childNodes.forEach((inp) => {
		
          //setting onclick eventListener for update button
		
          if (inp.className == "update") {
            inp.onclick = () => {
              let newData = this.pullData(el);
              updateDataset(oldData, newData, this.dataset);
              this.injectTemplate();
            }
          }
		
          //setting onclick eventListener for delete button 
		
          if (inp.className == "delete") {
            inp.onclick = () => {
              deleteItem(this.pullData(el), this.dataset);
              this.injectTemplate();
            }
          }
        });
      }
    });
  }

  /**
   *
   * @returns {HTML snippet} injectable a multiselectable crud of dataset items
   *
   */

  this.createMultiSelectables = () => {
    let injectable = ``;
    this.dataset.forEach((item) => {
      if (isObject(item)) {
        injectable += `<div class="${this.className}"><input type="checkbox"><br>` +
          Object.keys(item).map((key) => `<span title="${key}">${item[key]}</span><br>`).join("") +
          `<div class="crud" style="display:none;">
<input type="submit" class="update" value="Update">
<input type="submit" class="delete" value="Delete">
</div>
</div>`;
      }

      if (typeof item == "string") {
        injectable += `<div class="${this.className}">
<input type="checkbox"><span>${item}</span>
<div class="crud" style="display:none">
<input type="submit" class="update" value="Update">
<input type="submit" class="delete" value="Delete">
</div>
</div>\n`
      }
    })
    return injectable;
  }

  /**
   *
   * @description injects the mulitselectable dataset items to the targetID
   *
   */

  this.injectTemplate = () => {
    Q(this.targetID).innerHTML = this.createMultiSelectables();
    this.setEventListeners();
    Q(this.targetID).parentElement.style.display = this.createMultiSelectables().length > 0 ? "block" : "none";
  }
}

/**
 *
 * @description test sample for CRUD* 
 * 
 */

var testComponent = {
  template: `
<div>
<input type="text" id="orgname" name="orgname">
<input type="text" id="orgadd" name="orgadd">
<input type="submit" id="add" value="Add">
<div style="display:none;">
<div id="skillcomponent">
</div>
<input type="submit" id="remove" value="Remove">
</div>
</div>`,

  styles: `
.crud{padding:10px 0px; max-width:500px;}
.skill{padding:5px 0px; margin-top:2px; max-width:500px;}
.update, .delete{background-color:#50506f; color:f0f0ff; border:0px; padding:5px 10px;}
.skill > span{border:0px; border-radius:5px; padding:3px 5px; display:inline-block; margin-top:2px;width:95%;}
input[type="checkbox"]{border:2px solid red;}`
}

const appComponent = `
<!doctype html>
<html>
<head>
<style>
${testComponent.styles}
</style>
</head>
<body>
<main>
${testComponent.template}
</main>
</body>
<html>`;

document.write(appComponent);

/**
 *
 * @description creating dataset and managing through CRUD feature of CRUD object which in turn dynamically updates the view
 * 
 */

const mySet = new Set();
const myCrud = new CRUD(["#orgname", "orgadd"], mySet, "skill", "#skillcomponent");

const addBut = Q("#add");
const removeBut = Q("#remove");

//set eventlisteners for addBut and removeBut

addBut.onclick = () => myCrud.addItem();
removeBut.onclick = () => myCrud.deleteItems();
