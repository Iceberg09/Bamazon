var mysql = require("mysql");
var inquirer = require("inquirer");
var cTable = require("console.table");

// create the connection information for the sql database
var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "password01",
  database: "bamazon"
});

//Stores the quantity of the item chosen
var itemQuantity = 0;

//Stores the quantity the user wants to buy
var chosenQuantity = 0;

//Stores the itemQuantity - chosenQuantity (only if the number will be >= 0)
var remainingQuantity = 0;

//Stores the price of the selected item
var price = 0;

//item_id of the item the user decided to purchase
var chosenID = 0;


connection.connect(function(err) {
    if (err) throw err;

    start();
})

function start() {
    connection.query("SELECT * FROM products", function(err, results) {
        if (err) throw err;

        //Uses console.table library to show the user a list of all items available to be purchses after the bamazon.products table is queried
        console.table(results);

        promptSale();
    })
}

function promptSale() {

    //Have the user choose the item and amount they would like to purchase
    inquirer.
    prompt([
        {
            type: "input",
            message: "Please enter the item id that you would like to purchase:",
            name: "itemID"
        },
        {
            type: "input",
            message: "Enter the quantity that you would like to purhcase of this item:",
            name: "quantity"
        }
    ])
    .then(function(answer) {

        //Store the users responses in the previous created global variables above
        chosenQuantity = answer.quantity;

        chosenID = answer.itemID

        connection.query("SELECT stock_quantity, price FROM products WHERE ?",
        {
            item_id: answer.itemID
        },
        function(err, res) {

            //Store the quantity available of the item selected in the global variable above
            itemQuantity = res[0].stock_quantity;

            //Store the price of the item selected in the global variable above
            price = res[0].price;

            //If the amount the user wants to purchase is greater than the available stock, tell the user there isn't enough stock and ask if they would like to shop again
            if (chosenQuantity > itemQuantity) {

                console.log("Insufficient quantity!");

                shopAgain();

            } else {

                //Update the amount of stock that will remain after this purchase and complete the sale
                remainingQuantity = itemQuantity - chosenQuantity;

                completeSale();

            }
        })
    })
}

function completeSale() {

    //Update stock to the new remaining quantity
    connection.query("UPDATE products SET ? WHERE ?",
    [
        {
            stock_quantity: remainingQuantity
        },
        {
            item_id: chosenID
        }
    ],
    function(error) {
        if (error) throw error;

        //Show the user their final price based on previous stored price and quantity the user chose to purchase
        console.log("Your total is: $" + (price * chosenQuantity));

        //Ask the customer if they would like to shop for another item
        shopAgain();
    })
}

function shopAgain() {

    //Prompt the user with a yes or no option to shop again. If yes, restart the application. If no, give them a closing remark and close the connection to the database
    inquirer
    .prompt([
        {
            type: "list",
            choices: ["Yes", "No"],
            message: "Would you like to shop again?",
            name: "again"
        }
    ])
    .then(function(response){

        if (response.again === "Yes") {

            start();

        } else {

            console.log("Please come again soon!");
            
            connection.end();
        }
    })
}