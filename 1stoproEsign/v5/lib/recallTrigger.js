var data = {};
var recdetails={};
function recallDoc(){
	ZOHO.CRM.CONNECTOR.isConnectorAuthorized("zohosign").then(function(result)   // VerticalInventory Connector 
    {
        if(result == "false")
        {
        	alert("Zoho Sign didn't authorized");
				timeout = setTimeout(function() {
                	//ZOHO.CRM.UI.Popup.close();	
                	doNothing();
            	}, 1000);
        }else{
        	/*
        	dynamic_map = Map();
			//Map all dynamic params to your desired values 
			dynamic_map.put("reqId",signReqId);
			dynamic_map.put("remind","remind");
			remindResp = zoho.crm.invokeConnector("zohosign.remindrecipient",dynamic_map);
			info "remindResp is :: " + remindResp;
			status = remindResp.get("status_code");
			*/
			debugger;
			dMap = {};
			dMap.reqId = recdetails.Sign_Request_ID;
			dMap.remind = "recall";
			ZOHO.CRM.CONNECTOR.invokeAPI("zohosign.remindrecipient",dMap)
                .then(function(result){
                	console.log(result);
                    var resp = JSON.parse(result.response);
                    //code = resp.code;
                    //alert(code);
                    if("success" ==resp.status ){
                    	debugger;
                    	//alert(resp.message);                    			       			
	                      var config={
						  Entity:"ZohoSign_Documents",
						  APIData:{
						        "id": data.pageLoadData.EntityId[0],
						        "Document_Status": "RECALLED"
						  },
						  Trigger:["workflow"]
						}
						ZOHO.CRM.API.updateRecord(config)
						.then(function(data){
						    console.log(data);
						    $("#msgTxt").text(resp.message);
		       				$("#msgDiv").show();
						    timeout = setTimeout(function() {
			                	//ZOHO.CRM.UI.Popup.close();	
			                	//doNothing();
			                	ZOHO.CRM.UI.Popup.closeReload()
			            	}, 2000);
						})
                    }else{
                    	//alert(resp.message);
                    	$("#msgTxt").text(resp.message);
		       			$("#msgDiv").show();
		       			timeout = setTimeout(function() {			                	
			                	//ZOHO.CRM.UI.Popup.closeReload()
			                	doNothing();
			            	}, 2000);
                    }                   	
                })
        }
        //doNothing();
    });
}

function doNothing(){
	ZOHO.CRM.UI.Popup.close();	
}

function initFunc(){
	ZOHO.CRM.API.getRecord({Entity:data.pageLoadData.Entity,RecordID:data.pageLoadData.EntityId[0]})
       .then(function(data){ 
       		recdetails = data.data[0];
       		signReqId = recdetails.Sign_Request_ID;
       		docStatus = recdetails.Document_Status;
       		/*
       		if(docStatus == undefined || docStatus == null){
       			//alert("Document Status is "+docStatus);
       			console.log(docStatus);
       			$("#msgTxt").text("Document Status is "+docStatus);
       			$("#msgDiv").show();
       			timeout = setTimeout(function() {
                	//ZOHO.CRM.UI.Popup.close();	
                	doNothing();
            	}, 500);

       		}else */
       		if( (docStatus == undefined || docStatus == null) || (docStatus.toUpperCase() !== "INPROGRESS" && docStatus.toUpperCase() !== "VIEWED") ){
       			//alert("Document Status is "+docStatus+", So can't recall this document");
       			$("#msgTxt").text("Document Status is "+docStatus+", So can't recall this document");
       			$("#msgDiv").show();
       			timeout = setTimeout(function() {
                	//ZOHO.CRM.UI.Popup.close();	
                	doNothing();
            	}, 2000);
       		}else{
       			$("#confirmDiv").show();
       		}
        })
}