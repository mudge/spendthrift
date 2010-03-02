function nullDataHandler(){}function errorHandler(a,b){alert("There was an error (code "+b.code+"): "+b.message);return false}function updateGrandTotal(a,b){a=b.rows.item(0);document.getElementById("total").textContent=(a.total||0)/100}function updateWeeklyTotal(a,b){a=b.rows.item(0);document.getElementById("weekly_total").textContent=(a.total||0)/100}function updateMonthlyTotal(a,b){a=b.rows.item(0);document.getElementById("monthly_total").textContent=(a.total||0)/100}
function updateBreakdowns(a,b){a=document.getElementById("breakdowns");a.innerHTML="";for(var c=0;c<b.rows.length;c++){var d=b.rows.item(c),f=document.createElement("tr");a.appendChild(f);f.innerHTML="<th>"+d.spent_at_date+"</th><td>&pound;"+d.total/100+"</td>"}}
function updateAverages(a,b){for(a=0;a<b.rows.length;a++){var c=b.rows.item(a);switch(c.weekday){case "0":document.getElementById("sunday").textContent=c.total/100/numberOfWeeks;break;case "1":document.getElementById("monday").textContent=c.total/100/numberOfWeeks;break;case "2":document.getElementById("tuesday").textContent=c.total/100/numberOfWeeks;break;case "3":document.getElementById("wednesday").textContent=c.total/100/numberOfWeeks;break;case "4":document.getElementById("thursday").textContent=
c.total/100/numberOfWeeks;break;case "5":document.getElementById("friday").textContent=c.total/100/numberOfWeeks;break;case "6":document.getElementById("saturday").textContent=c.total/100/numberOfWeeks;break}}}function setNumberOfWeeks(a,b){a=new Date(b.rows.item(0).oldest);numberOfWeeks=Math.ceil((new Date-a)/1E3/60/60/24/7)}
function updatePage(a){a.executeSql("SELECT SUM(amount) AS total FROM spends",[],updateGrandTotal,errorHandler);a.executeSql("SELECT SUM(amount) AS total FROM spends WHERE spent_at > datetime('now', '-7 days', 'weekday 1', 'start of day')",[],updateWeeklyTotal,errorHandler);a.executeSql("SELECT SUM(amount) AS total FROM spends WHERE spent_at > datetime('now', 'start of month', 'start of day')",[],updateMonthlyTotal,errorHandler);a.executeSql("SELECT spent_at, date(spent_at) AS spent_at_date, SUM(amount) AS total FROM spends GROUP BY spent_at_date",
[],updateBreakdowns,errorHandler);a.executeSql("SELECT MIN(spent_at) AS oldest FROM spends",[],setNumberOfWeeks,errorHandler);a.executeSql("SELECT strftime('%w', spent_at) AS weekday, SUM(amount) AS total FROM spends GROUP BY weekday",[],updateAverages,errorHandler)}
function addSpend(){var a=document.getElementById("description"),b=a.value,c=document.getElementById("amount"),d=c.value;if(parseFloat(d)>0){var f=d*100;db.transaction(function(g){g.executeSql("INSERT INTO spends (amount, description) VALUES (?, ?)",[f,b],updatePage,errorHandler)})}c.value="";a.value="";return false}if(window.openDatabase)try{var db=openDatabase("spendthrift","1.0","Spendthrift Database",65536),numberOfWeeks=1}catch(e){alert("Error opening database "+e)}else alert("Spendthrift is not supported by your current browser.");
db.transaction(function(a){a.executeSql("CREATE TABLE IF NOT EXISTS spends (id INTEGER PRIMARY KEY, amount INTEGER NOT NULL, description NVARCHAR, spent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);",[],nullDataHandler,errorHandler)});db.transaction(function(a){updatePage(a)});
