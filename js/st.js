function numberToCurrency(number, precision) {
  if (!precision) {
    precision = 2
  }
  return Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision);
}

function nullDataHandler(transaction, results) {}
function errorHandler(transaction, error) {
  alert("There was an error (code " + error.code + "): " + error.message);
  return false;
}

function updateGrandTotal(transaction, results) {
  var result = results.rows.item(0)
  document.getElementById('total').textContent = numberToCurrency((result['total'] || 0) / 100.0);
  document.getElementById('daily_average').textContent = numberToCurrency(((result['total'] || 0) / 100.0) / numberOfDays);
  document.getElementById('weekly_average').textContent = numberToCurrency(((result['total'] || 0) / 100.0) / numberOfWeeks);
}

function updateWeeklyTotal(transaction, results) {
  var result = results.rows.item(0)
  document.getElementById('weekly_total').textContent = numberToCurrency((result['total'] || 0) / 100.0);
}

function updateMonthlyTotal(transaction, results) {
  var result = results.rows.item(0)
  document.getElementById('monthly_total').textContent = numberToCurrency((result['total'] || 0) / 100.0);
}

function updateLastMonthTotal(transaction, results) {
  var result = results.rows.item(0)
  document.getElementById('last_month').textContent = numberToCurrency((result['total'] || 0) / 100.0);

  var month_delta = parseFloat(document.getElementById('last_month').textContent) - parseFloat(document.getElementById('monthly_total').textContent);
  document.getElementById('month_delta').textContent = numberToCurrency(month_delta);
}

function updateBreakdowns(transaction, results) {
  var breakdowns = document.getElementById('breakdowns');
  breakdowns.innerHTML = '';
  for (var i = 0; i < results.rows.length; i++) {
    var result = results.rows.item(i);
    var newBreakdown = document.createElement('tr');
    breakdowns.appendChild(newBreakdown);
    if (i % 2 == 1) {
      newBreakdown.className = "even";
    }
    newBreakdown.innerHTML = '<th>' + result['spent_at_date'] + '</th><td>&pound;' + numberToCurrency(result['total'] / 100.0) + '</td>';
  }
}

function updateAverages(transaction, results) {
  for (var i = 0; i < results.rows.length; i++) {
    var result = results.rows.item(i);
    switch(result["weekday"]) {
      case "0":
        document.getElementById('sunday').textContent = numberToCurrency((result["total"] / 100.0) / numberOfWeeks);
        break;
      case "1":
        document.getElementById('monday').textContent = numberToCurrency((result["total"] / 100.0) / numberOfWeeks);
        break;
      case "2":
        document.getElementById('tuesday').textContent = numberToCurrency((result["total"] / 100.0) / numberOfWeeks);
        break;
      case "3":
        document.getElementById('wednesday').textContent = numberToCurrency((result["total"] / 100.0) / numberOfWeeks);
        break;
      case "4":
        document.getElementById('thursday').textContent = numberToCurrency((result["total"] / 100.0) / numberOfWeeks);
        break;
      case "5":
        document.getElementById('friday').textContent = numberToCurrency((result["total"] / 100.0) / numberOfWeeks);
        break;
      case "6":
        document.getElementById('saturday').textContent = numberToCurrency((result["total"] / 100.0) / numberOfWeeks);
        break;
    }
  }
}

function exportSpends() {
  var mailto = "mailto:?subject=Spendthrift Export&body=[";
  db.transaction(function(t) {
    t.executeSql('SELECT * FROM spends', [], function(transaction, results) {
      var length = results.rows.length;
      for (var i = 0; i < length; i++) {
        var result = results.rows.item(i);
        mailto = mailto + JSON.stringify(result);
        if (i != length - 1) {
          mailto = mailto + ", ";
        }
      }
      window.location = mailto + "]";
    }, errorHandler);
  });
  return false;
}

function setNumberOfDaysAndWeeks(transaction, results) {
  if (results.rows.item(0)["oldest"]) {
    var oldestValues = results.rows.item(0)["oldest"].split(/\D/);
    var oldest = new Date(oldestValues[0], oldestValues[1] - 1, oldestValues[2], oldestValues[3], oldestValues[4], oldestValues[5]);
    var distance = new Date() - oldest;

    /* 1 day = 86,400,000 milliseconds. */
    numberOfDays = Math.ceil(distance / 86400000);
    numberOfWeeks = Math.ceil(numberOfDays / 7);
  }
}

function updatePage(transaction, results) {
  transaction.executeSql('SELECT MIN(spent_at) AS oldest FROM spends', [], setNumberOfDaysAndWeeks, errorHandler);
  transaction.executeSql('SELECT SUM(amount) AS total FROM spends', [], updateGrandTotal, errorHandler);
  transaction.executeSql('SELECT SUM(amount) AS total FROM spends WHERE spent_at > datetime(\'now\', \'-7 days\', \'weekday 1\', \'start of day\')', [], updateWeeklyTotal, errorHandler);
  transaction.executeSql('SELECT SUM(amount) AS total FROM spends WHERE spent_at > datetime(\'now\', \'start of month\', \'start of day\')', [], updateMonthlyTotal, errorHandler);
  transaction.executeSql('SELECT SUM(amount) AS total FROM spends WHERE spent_at > datetime(\'now\', \'-1 month\', \'start of month\', \'start of day\') AND spent_at < datetime(\'now\', \'start of month\', \'start of day\')', [], updateLastMonthTotal, errorHandler);
  transaction.executeSql('SELECT spent_at, date(spent_at) AS spent_at_date, SUM(amount) AS total FROM spends GROUP BY spent_at_date', [], updateBreakdowns, errorHandler);
  transaction.executeSql('SELECT strftime(\'%w\', spent_at) AS weekday, SUM(amount) AS total FROM spends GROUP BY weekday', [], updateAverages, errorHandler);
}

function addSpend() {
  var descriptionField = document.getElementById('description');
  var description = descriptionField.value;
  var amountField = document.getElementById('amount');
  var amount = amountField.value;
  if (parseFloat(amount) > 0) {
    var pence = amount * 100;
    db.transaction(function(t) {
      t.executeSql('INSERT INTO spends (amount, description) VALUES (?, ?)', [pence, description], updatePage, errorHandler);
    });
  }
  amountField.value = '';
  descriptionField.value = '';
  return false;
}

if (!window.openDatabase) {
  alert('Spendthrift is not supported by your current browser.');
} else {
  try {
    var db = openDatabase('spendthrift', '1.0', 'Spendthrift Database', 65536);
    var numberOfWeeks = 1;
    var numberOfDays = 1;
  } catch(e) {
    alert("Error opening database " + e);
  }
}

db.transaction(function(t) {
  t.executeSql('CREATE TABLE IF NOT EXISTS spends (id INTEGER PRIMARY KEY, amount INTEGER NOT NULL, description NVARCHAR, spent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);', [], nullDataHandler, errorHandler);
});

db.transaction(function(t) {
  updatePage(t);
});
