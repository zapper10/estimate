const logger = require("../common/winston");

module.exports = function(pool) {

    ////////////////////////////
    // INSTANTIATE THE DRIVER //
    ////////////////////////////
    var oracledb = require("oracledb"); 
  
  
  
    //////////////////////
    // GET A CONNECTION //
    //////////////////////
    var doConnect = function(callback) {
  
    //   console.log("INFO: Module getConnection() called - attempting to retrieve a connection using the node-oracledb driver");
  
      pool.getConnection(function(err, connection) {
  
        // UNABLE TO GET CONNECTION - CALLBACK WITH ERROR
        if (err) { 
            logger.error(`Cannot get a connection: ${err}`)
            return callback(err);
        }
  
        // If pool is defined - show connectionsOpen and connectionsInUse
        if (typeof pool !== "undefined") {
            logger.debug(`Connection Is : ${pool.connectionsOpen} / ${pool.connectionsInUse}`)
        }
  
        // Else everything looks good
        // Obtain the Oracle Session ID, then return the connection
        doExecute(connection, "SELECT SYS_CONTEXT('userenv', 'sid') AS session_id FROM DUAL", {}, function(err, result) {
  
          // Something went wrong, releae the connection and return the error
          if (err) {
            logger.error(`Unable to determine Oracle SESSION ID for this transaction: ${err}`)
            // releaseConnection(connection);
            connection.release();
            return callback(err);
          }
  
          // Log the connection ID (we do this to ensure the conncetions are being pooled correctly)
        //   console.log("INFO: Connection retrieved from the database, SESSION ID: ", result.rows[0]['SESSION_ID']);
  
          // Return the connection for use in model
          return callback(err, connection);
  
        });
  
      });
  
    }
  
  
  
    /////////////
    // EXECUTE //
    /////////////
    var doExecute = function(connection, sql, params, callback) {
  
      connection.execute(sql, params, { autoCommit: true, outFormat: oracledb.OBJECT, maxRows:1000 }, function(err, result) {
  
        // Something went wrong - handle the data and release the connection
        if (err) {
            logger.error(`Unable to execute the SQL: ${err}`)
            //releaseConnection(connection);
            return callback(err);
        }
  
        // Return the result to the request initiator
        // console.log("INFO: Result from Database: ", result)
        return callback(err, result);
  
      });
  
    }  
  
  
  
    ////////////
    // COMMIT //
    ////////////
    var doCommit = function(connection, callback) {
      connection.commit(function(err) {
        if (err) {
            logger.error(`Unable to COMMIT transaction: ${err}`);
        }
        return callback(err, connection);
      });
    }
  
  
  
    //////////////
    // ROLLBACK //
    //////////////
    var doRollback = function(connection, callback) {
      connection.rollback(function(err) {
        if (err) {
            logger.error(`Unable to ROLLBACK transaction: ${err}`);
        }
        return callback(err, connection);
      });
    }
  
  
  
    //////////////////////////
    // RELEASE A CONNECTION //
    //////////////////////////
    var doRelease = function(connection) {
      connection.release(function(err) {
        if (err) {
            logger.error(`Unable to RELEASE the connection: ${err}`);
        }
        return;
      });
  
    }
  
  
  
    //////////////////////////////
    // EXPORT THE FUNCTIONALITY //
    //////////////////////////////
    module.exports.doConnect  = doConnect;
    module.exports.doExecute  = doExecute;
    module.exports.doCommit   = doCommit;
    module.exports.doRollback = doRollback;
    module.exports.doRelease  = doRelease;
  
  }