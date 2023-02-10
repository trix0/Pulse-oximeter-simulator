const express = require('express')
const bodyParses = require('body-parser')
var request = require('request');
const app = express()
const path = require('path');
const port = process.env.PORT || 8080;



app.use(express.static(__dirname + '/public'));
app.use(bodyParses.json());

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/index.html'));
})

app.post('/oximeterValues', function (request, response) {
  let body={"value":request.body,"type":"DATA"};
  sendCommand(body);
  response.send(body);    // echo the result back


});
app.post('/oximeterState', function (request, response) {
  let body={"value":request.body,"type":"POWER"};
  sendCommand(body);
});

const sendCommand=(body)=>{
  request({
    url: 'http://localhost:5000/command',
    method: "POST",
    json: true,  
    body: body
  }, function (error, response, body) {
    console.log(response);
  });
  response.send(req.body);    // echo the result back
}
