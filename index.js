let express = require('express')
let line    = require('@line/bot-sdk')
let request = require('request')
let cheerio = require('cheerio')


let lineAccount = require("./lineKey.json")
let client    = new line.Client(lineAccount)

let app = express()

app.post('/webhook', line.middleware(lineAccount), (req, res) => {
  Promise.all(req.body.events.map(lineEvent)).then(() => res.status(200).send()).catch(() => res.status(400).send())
});

let lineEvent = function (event) {
  return new Promise((resolve, reject) => {
    if (event.type === 'message' && event.message.type === 'text') {
      let text = event.message.text
      let response = ''
      if (/[Cc]urriculum|課表/g.test(text)) {
        
      } else if (/[Ww]eather|天氣/g.test(text)) {
        request.get('http://www.cwb.gov.tw/V7/forecast/taiwan/Taipei_City.htm', (err, res, body) => {
          let $ = cheerio.load(body)
          let rows = $('body #container #main #content_inner #ContainerInOne #box8 .FcstBoxTable01 tbody tr')
          for (let index = 0; index < rows.length; index++) {
            let weather = rows.eq(index).children()
            response += weather.eq(0).text().split(' ')[0] + ':' + weather.eq(1).text().replace(/(^\s+)|(\s+$)/g, "") + '℃ 降雨機率' + weather.eq(4).text().replace(/(^\s+)|(\s+$)/g, "") + '\n'
          }
          reply(event, response).then(() => resolve()).catch(() => reject())
        })
      } else if (/[Cc]md|[Hh]elp|指令|幫助/g.test(text)) {
        response = '指令:\n' + 
                   '[Cc]urriculum|課表: 查詢課表\n' + 
                   '[Ww]eather|天氣: 查詢天氣\n' + 
                   '[Cc]md|[Hh]elp|指令|幫助: 查詢指令'
        
        reply(event, response)
      } else {
        reply(event, '沒有這個指令，可以輸入Help查詢指令')
      }
      
    }
  })
}

let reply = function(event, text) {
  return new Promise((resolve, reject) => {
    client.replyMessage(event.replyToken, { type: 'text', text: text }).then(() => resolve()).catch(error => {
      console.log(error)
      reject()
    })
  })
  
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});