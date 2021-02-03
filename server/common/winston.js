const appRoot = require('app-root-path');    // app root 경로를 가져오는 lib
const winston = require('winston');            // winston lib
const process = require('process');
const winstonDaily = require('winston-daily-rotate-file');
 
const { combine, timestamp, printf } = winston.format;
const logDir = `${appRoot}/logs`;
 
const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level}]: ${message}`;    // log 출력 포맷 정의
});
 
let logger = new winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat,
    ),
    transports: [
        // info 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir,
            filename: `%DATE%.log`,
            maxFiles: 30,  // 30일치 로그 파일 저장
            zippedArchive: true, 
            json: false,
        }),
        // info 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'debug',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir + '/debug',
            filename: `%DATE%.log`,
            maxFiles: 30,  // 30일치 로그 파일 저장
            zippedArchive: true, 
            json: false,
        }),
        // error 레벨 로그를 저장할 파일 설정
        new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir + '/error',  // error.log 파일은 /logs/error 하위에 저장 
            filename: `%DATE%.error.log`,
            maxFiles: 30,
            zippedArchive: true,
            json: false,
        }),
    ],
});
 
if(process.env.NODE_ENV !== 'production'){
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),  // 색깔 넣어서 출력
            winston.format.simple(),  // `${info.level}: ${info.message} JSON.stringify({ ...rest })` 포맷으로 출력
        )
    }));
}

logger.stream = {
    write: function(message, encoding) {
        logger.info(message); // 단순히 message를 default 포맷으로 출력
    },
};
module.exports = logger;
