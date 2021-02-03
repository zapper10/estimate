var express = require('express');
var router = express.Router();
const gWebResult = require("../json/web-result.json");
var db      = require("../libs/oracledb.js");
var request = require("request");
var moment = require('moment');
const Slack = require('slack-node');
const webhookUri = "https://hooks.slack.com/services/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";

/**
 * Router Middleware 
 * 
 * @author Suhan Kim
 * @since 2020-10-27
 */
router.use(function (req, res, next) {
  next();
});

router.post('/', function(req, res, next) {
  let webResult = {...gWebResult};
  const client = req.body.CLIENT;
  const name = req.body.NAME;
  const email = req.body.EMAIL;
  const phone = req.body.PHONE;
  const title = req.body.TITLE;
  const content = req.body.CONTENT;

  db.doConnect(function(err,connection) {
    if (err) {
      db.doRelease(connection);
      res.status(500).json({message:err});
      return;
    }

    const query = "INSERT INTO TB_CONSULT (CLIENT,NAME,EMAIL,PHONE,TITLE,CONTENT,REG_DT)"
                + "VALUES(:client,:name,:email,:phone,:title,:content,SYSDATE)";

    db.doExecute(
      connection, query
      , {"name" : name, "title" : title, "client" : client, "email" : email, "phone" : phone, "content" : content}
      , function(err, result) {
          db.doRelease(connection);

          if (err) {
              res.status(500).json({message:err});
              return;
          }
          
          const slack = new Slack();
          slack.setWebhook(webhookUri);
          const date = new Date().getTime();
          const send = async(message) => {
                slack.webhook({
                    payload: {},
                    attachments: [
                      {
                        mrkdwn_in: ["text"],
                          color: "#36a64f",
                          pretext: "신규 견적 문의가 들어왔습니다.",
                          author_name: client,
                          author_icon: "https://placeimg.com/16/16/people",
                          title: "title",
                          text: title, // 아마 제목이 들어갈부분
                          fields: [
                              {
                                  title: "내용",
                                  value: content,
                                  short: false
                              },
                              {
                                  title: "연락처",
                                  value: phone,
                                  short: true
                              },
                              {
                                  title: "이메일",
                                  value: email,
                                  short: true
                              }
                          ],
                          thumb_url: "http://placekitten.com/g/200/200", // 우측 고양이사진
                          footer: name,
                          footer_icon: "https://platform.slack-edge.com/img/default_application_icon.png", // footer문구옆 작은아이콘
                          ts: date
                      }
                  ]
            }, function(err, response){
                    if(err !== null) {
                        webResult.result = -1;
                        webResult.message = err;
                        res.status(400).send(webResult);
                        return;
                    }

                    webResult.result = 1;
                    webResult.message = '문의 요청에 성공하셨습니다. \n빠른 시일내로 답변드리도록 하겠습니다.';
                    res.status(200).json(webResult); 
                });
            }
            
            send();
         
      }
  ); 

  });

  
});

module.exports = router;
