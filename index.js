const program = require('commander');
const octokit = require('@octokit/rest');
const csv = require('csv-stringify');
const fs = require('fs');
const client = octokit();
const flatten = require('flatten');
const path = require('path');

program
    .version('0.1.0')
    .option('-t, --token [token]', 'token d\'accès')
    .option('-k, --keyword [keyword]', 'recherche par mot clés')
    .option('-d, --date [date]')
    .parse(process.argv);

let query = "";

if (program.keyword){
    query += program.keyword + " ";
}

if (program.token){
    client.authenticate({
        type: 'token',
        token: program.token
    });
}

let date = new Date();
date.setDate(date.getDate() -2);
if (program.date){
    if (!isNaN(Date.parse(program.date))){
        date = new Date(Date.parse(program.date));
    }
}
Qdate = "pushed:>";
Qdate += date.getFullYear() + "-";
if (date.getMonth() > 9){
    Qdate += (date.getMonth() + 1) + "-";
}else {
    Qdate += "0" + (date.getMonth() + 1) + "-";
}
if (date.getDay() > 9){
    Qdate += (date.getDay() + 1) + "-";
}else {
    Qdate += "0" + (date.getDay() + 1);
}
query += Qdate + " ";

console.log(query);


client.search.repos({'q': query})
    .then(result => {
        Promise
            .all(result.data.items.map(function (item) {
                return client.activity.getStargazersForRepo({
                    'owner': item.owner.login,
                    'repo': item.name,
                    'per_page': 10,
                    'page': 1
                })
            }))
            .then(response => {
                let data = response.map(function (stargazer) {
                    return stargazer.data;
                });
                let ListeStargazers = flatten(data);
                let ListeStargazersModifie = ListeStargazers.map(function (stargazer) {
                    return [stargazer.user.login, stargazer.user.id, stargazer.user.html_url];
                });
                let column = ['login', 'id', 'html_url'];
                ListeStargazersModifie.unshift(column);
                csv(ListeStargazersModifie, function (err, output) {
                    fs.writeFile('my.csv', output, (err) => {
                        if (err){
                            console.log(err);
                        }else {
                            let p = path.resolve('my.csv');
                            console.log(p + " saved!");
                        }
                    })
                })
            })
            .catch(function (err) {
                console.log(err);
            });
    })
    .catch(function (err) {
        console.log(err);
    });