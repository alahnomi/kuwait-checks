const Tafgeet = require("./tafgeet");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const liveServer = require("live-server");
const inquirer = require("inquirer");
const moment = require("moment");
const _ = require("lodash");
const fuzzy = require("fuzzy");

inquirer.registerPrompt(
  "autocomplete",
  require("inquirer-autocomplete-prompt")
);

var beneficiaryList = fs
  .readFileSync("beneficiaries.txt")
  .toString()
  .split("\n");

function searchBenef(answers, input) {
  input = input || "";
  return new Promise(function(resolve) {
    setTimeout(function() {
      var fuzzyResult = fuzzy.filter(input, beneficiaryList);
      resolve(
        fuzzyResult.map(function(el) {
          return el.original;
        })
      );
    }, _.random(30, 500));
  });
}

var file = new Date().valueOf();
var params = {
  port: 8181, // Set the server port. Defaults to 8080.
  host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
  root: "./", // Set root directory that's being served. Defaults to cwd.
  open: true, // When false, it won't load your browser by default.
  file: "output.pdf", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
  wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
  logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
  middleware: [
    function(req, res, next) {
      next();
    }
  ] // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
};

var questions = [
  {
    type: "input",
    name: "amount",
    message: "Amount",
    validate: function(value) {
      var valid = !isNaN(parseFloat(value));
      return valid || "Please enter a number";
    },
    filter: Number
  },
  {
    type: "autocomplete",
    suggestOnly: true,
    name: "beneficiary",
    message: "Beneficiary",
    source: searchBenef
  },
  {
    type: "input",
    name: "date",
    message: "Date",
    default: moment().format("l")
  }
];

inquirer.prompt(questions).then(answers => {
  async function createOutoput() {
    var doc = new PDFDocument({
      layout: "landscape",
      margin: 0
    });
    var amountString = new Tafgeet(answers.amount, "KWD").parse();
    var amount = amountString.split(" ");
    var beneficiary = " " + answers.beneficiary;
    beneficiary = beneficiary.split(" ");

    doc.pipe(fs.createWriteStream("output.pdf"));
    doc
      .font("./fonts/Cairo/Cairo-SemiBold.ttf")
      .fontSize(10)
      .text(beneficiary.reverse().join(" "), 76, 260, {
        align: "center",
        width: 240
      });

    doc
      .font("./fonts/Cairo/Cairo-SemiBold.ttf")
      .fontSize(10)
      .text(amount.reverse().join(" "), 76, 289, {
        align: "center",
        width: 240
      });

    doc
      .font("./fonts/Cairo/Cairo-SemiBold.ttf")
      .fontSize(12)
      .text("# " + answers.amount + " #", 374, 309, {
        align: "center",
        width: 113
      });

    doc
      .font("./fonts/Cairo/Cairo-SemiBold.ttf")
      .fontSize(10)
      .text(answers.date, 394, 260, {
        align: "center",
        width: 70
      });
    await doc.end();
  }

  createOutoput().then(liveServer.start(params));
});
