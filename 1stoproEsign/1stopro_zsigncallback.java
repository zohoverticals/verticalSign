sendmail
[
	from :zoho.adminuserid
	to :"hariharasudhan.sk@zohocorp.com"
	subject :"ZohoSIGNCallBack Check for 1stopro crm!"
	message :crmAPIRequest.toString()
]
info "zohosign info";
resp = zoho.crm.invokeConnector("crm.modulesmeta",Map()).toString().toMap();
responseObj = resp.get("response").toMap();
modules = responseObj.get("modules").toJSONList();
zohoSignDocumentsEvents = "";
zohoSignDocuments = "";
zohoSignRecipients = "";
curDate = zoho.currentdate;
info "inside zohosigncallback method";
for each  module in modules
{
	currentModuleMap = module.toMap();
	if(currentModuleMap.get("api_name").equalsIgnoreCase("ZohoSign_Document_Events"))
	{
		zohoSignDocumentsEvents = currentModuleMap.get("module_name");
	}
	if(currentModuleMap.get("api_name").equalsIgnoreCase("ZohoSign_Documents"))
	{
		zohoSignDocumentsEvents = currentModuleMap.get("module_name");
	}
	if(currentModuleMap.get("api_name").equalsIgnoreCase("ZohoSign_Recipients"))
	{
		zohoSignDocumentsEvents = currentModuleMap.get("module_name");
	}
}
inputMap = crmAPIRequest.get("body");
reqMap = inputMap.toMap();
info reqMap;
sendmail
[
	from :zoho.adminuserid
	to :"hariharasudhan.sk@zohocorp.com"
	subject :"1stopro IDC Test"
	message :reqMap.toString()
]
documents = reqMap.get("document_ids").toJSONList();
documentStatus = reqMap.get("request_status");
requestId = reqMap.get("request_id");
documentNotes = reqMap.get("notes");
documentDescription = reqMap.get("description");
currentNotification = reqMap.get("notifications").toMap();
documentIds = List();
orgVar = zoho.crm.getOrgVariable("AuthToken");
info "orgVar :: " + orgVar;
currentNotifiedEmail = currentNotification.get("performed_by_email");
activityVal = currentNotification.get("activity");
if(activityVal.isNull() || activityVal.isEmpty())
{
	activityVal = "";
}
operation_type = currentNotification.get("operation_type");
if(operation_type.isNull() || operation_type.isEmpty())
{
	operation_type = "";
}
info "performed_by_email is : " + currentNotifiedEmail;
if(!currentNotifiedEmail.equalsIgnoreCase("System Generated"))
{
	for each  currentDocument in documents
	{
		currentDocumentMap = currentDocument.toMap();
		currentDocumentId = currentDocumentMap.get("document_id");
		currentDocumentName = currentDocumentMap.get("document_name");
		documentIds.add(currentDocumentId);
		mp = {"module":"ZohoSign_Documents","criteria":"ZohoSign_Document_ID:equals:" + currentDocumentId};
		contact = "";
		horseId = "";
		deals_Id = "";
		contract_Id = "";
		zohoSignDocumentSearchRecord = zoho.crm.invokeConnector("crm.search",mp).toString().toMap();
		if(zohoSignDocumentSearchRecord.get("response") != null && zohoSignDocumentSearchRecord.get("response").length() > 3)
		{
			zohoSignDocumentSearchRecord = zohoSignDocumentSearchRecord.get("response").toMap();
			zohoSignDocumentSearchRecord = zohoSignDocumentSearchRecord.get("data").toJSONList().toString().toMap();
			searchDocumentId = zohoSignDocumentSearchRecord.get("id");
			deals = zohoSignDocumentSearchRecord.get("Deals");
			contract = zohoSignDocumentSearchRecord.get("Contract_Changes");
			curDocumentStatus = zohoSignDocumentSearchRecord.get("Document_Status");
			if("completed".equalsIgnoreCase(curDocumentStatus) || "declined".equalsIgnoreCase(curDocumentStatus))
			{
				info "Document already " + curDocumentStatus + " So ending here!";
				sendmail
				[
					from :zoho.adminuserid
					to :"hariharasudhan.sk@zohocorp.com"
					subject :"1stopro Document already " + curDocumentStatus + " So ending here!"
					message : "Sign Document ID is : "+searchDocumentId 
				]
				return "Success";
			}
			if(!deals.isNull() && !deals.isEmpty())
			{
				deals_Id = deals.get("id");
			}
			if(!contract.isNull() && !contract.isEmpty())
			{
				contract_Id = contract.get("id");
			}
			horse = zohoSignDocumentSearchRecord.get("Horse");
			if(!horse.isNull() && !horse.isEmpty())
			{
				horseId = horse.get("id");
			}
			contact = zohoSignDocumentSearchRecord.get("Contacts");
			if(!contact.isNull() && !contact.isEmpty())
			{
				contact = contact.get("id");
			}
		}
		else
		{
			info "zohoSignDocumentSearchRecord is empty! Hence fetch from customview.";
			if(orgVar != null || orgVar != "")
			{
				authMap = Map();
				authMap.put("Authorization",orgVar);
				cv_res = getUrl("http://1stopro.zohoplatform.com/crm/v2/settings/custom_views?module=ZohoSign_Documents",authMap);
				info "cv_res" + cv_res;
				respList = cv_res.get("custom_views").toJSONList();
				for each  customRec in respList
				{
					// 			info customRec;
					customRecMap = customRec.toMap();
					displayValue = customRecMap.get("display_value");
					info "displayValue :: " + displayValue;
					if(displayValue == "Recently Created ZohoSign Documents")
					{
						cvid = customRec.get("id");
						info "cvid is :: " + cvid;
						break;
					}
				}
				if(cvid != null)
				{
					getRecords = getUrl("http://1stopro.zohoplatform.com/crm/v2/ZohoSign_Documents?cvid=" + cvid,authMap);
					//info getRecords;
					getResult = getRecords.get("data");
					for each  record in getResult
					{
						info "Each Record: " + record;
						curUID = record.get("ZohoSign_Document_ID");
						if(curUID == currentDocumentId)
						{
							searchDocumentId = record.get("id");
							info "record id found! under getRecords CVID api : " + searchDocumentId;
						}
						curDocumentStatus = record.get("Document_Status");
						if("completed".equalsIgnoreCase(curDocumentStatus) || "declined".equalsIgnoreCase(curDocumentStatus))
						{
							info "Document already " + curDocumentStatus + " So ending here! (under cvid code)";
							return "Success";
						}
					}
				}
			}
		}
		zohoSignDocumentMap = Map();
		zohoSignDocumentMap.put("id",searchDocumentId);
		zohoSignDocumentMap.put("Document_Status",documentStatus.toUpperCase());
		zohoSignDocumentMap.put("Document_Note",documentNotes);
		zohoSignDocumentMap.put("Document_Description",documentDescription);
		if(documentStatus == "completed" || documentStatus == "inprogress")
		{
			//linkURL = "https://sign.zoho.com/zs#/request/details/" + requestId;
			//zohoSignDocumentMap.put("ZohoSign_Link",linkURL);
			if(documentStatus == "completed")
			{
				zohoSignDocumentMap.put("Date_Completed",curDate);
			}
			else
			{
				zohoSignDocumentMap.put("Date_Sent",curDate);
			}
		}
		if(documentStatus == "declined")
		{
			zohoSignDocumentMap.put("Date_Declined",curDate);
			//zohoSignDocumentMap.put("",);
		}
		if((documentStatus == "completed" || documentStatus == "declined") && !activityVal.toLowerCase().contains("view"))
		{
			downloadMap = Map();
			downloadMap.put("reqId",requestId);
			downloadMap.put("docId",currentDocumentId);
			downloadMap.put("$RESPONSE_TYPE$","stream");
			info downloadMap;
			resp = zoho.crm.invokeConnector("zohosign.downloaddocument",downloadMap);
			if(isFile(resp))
			{
				resp.setFileName(currentDocumentName + ".pdf");
				//atc = zoho.crm.attachFile("Sales_Orders", recordId, resp);
				attachDoc = zoho.crm.attachFile("ZohoSign_Documents",searchDocumentId,resp);
				if(horseId != "")
				{
					attachDoc = zoho.crm.attachFile("Horses",horseId,resp);
					info "\n\n Horse Attached " + attachDoc;
				}
				if(deals_Id != "")
				{
					attachDoc = zoho.crm.attachFile("Deals",deals_Id,resp);
					info "\n\n Deals Attached " + attachDoc;
					/*if(documentStatus == "completed")
					{
						_Status = "Signed";
					}
					else
					{
						_Status = "Cancelled";
					}
					updateDocStatusMap = Map();
					updateDocStatusMap.put("id",deals_Id);
					updateDocStatusMap.put("Status",_Status);
					docStatusList = List();
					docStatusList.add(updateDocStatusMap);
					finalMap = {"module":"Deals","data":docStatusList};
					updateStatus = zoho.crm.invokeConnector("crm.update",finalMap);
					*/
				}
				if(contract_Id != "")
				{
					attachDoc = zoho.crm.attachFile("Contract_Changes",contract_Id,resp);
				}
			}
			// Raise Signal
			if(contact != "")
			{
				contactResp = zoho.crm.getRecordById("Contacts",contact);
				contactEmail = contactResp.get("Email");
				//criteria = "Email:equals:" + contactEmail;
			}
			if(contactEmail.isNull() || contactEmail.isEmpty())
			{
				criteria = "Email:equals:" + zoho.adminuserid;
				zohoRec = zoho.crm.searchRecords("Contacts",criteria);
				info "zohoSearch Record: \n";
				info zohoRec;
				if(zohoRec.isNull() || zohoRec.isEmpty())
				{
					contactEmail = zoho.adminuserid;
					info "No admin record found in CRM(search based on email)!";
					contMap = Map();
					contMap.put("Last_Name","AdminUser");
					contMap.put("Email",zoho.adminuserid);
					contRec = zoho.crm.createRecord("Contacts",contMap);
					info contRec;
				}
				else
				{
					contactEmail = zohoRec.get(0).get("Email");
					info contactEmail;
				}
			}
			// Here create Zoho Notification!
			signalMap = Map();
			signalMap.put("signal_namespace","signal__esignsignal");
			signalMap.put("email",contactEmail);
			signalMap.put("subject","E-Sign " + documentStatus);
			signalMap.put("message","E-Sign has been " + documentStatus + ". Find the document in attachment");
			actionsList = List();
			actionMap = Map();
			actionMap.put("type","link");
			dispName = "E-Sign document! (" + searchDocumentId + ")";
			actionMap.put("display_name",dispName);
			actionMap.put("url","/crm/EntityInfo.do?module=CustomModule14&id=" + searchDocumentId);
			//2970850000000924025");
			actionsList.add(actionMap);
			signalMap.put("actions",actionsList);
			info "\n\n\n Signals Map : " + signalMap;
			result = zoho.crm.invokeConnector("raisesignal",signalMap);
			info result;
			sendmail
			[
				from :zoho.adminuserid
				to :"hariharasudhan.sk@zohocorp.com"
				subject :"1stopro crm! Signal Response!!"
				message :result
			]
		}
		zohoSignDocumentList = List();
		zohoSignDocumentList.add(zohoSignDocumentMap);
		updateMap = {"module":"ZohoSign_Documents","data":zohoSignDocumentList};
		info "going to update zohosign_documents module";
		updateResp = zoho.crm.invokeConnector("crm.update",updateMap);
		info "updateRESP :" + updateResp;
		documentsEventsName = currentDocumentName + "-" + documentStatus.toUpperCase();
		currentNotifiedEmail = currentNotification.get("performed_by_email");
		info "performed_by_email is : " + currentNotifiedEmail;
		if(currentNotifiedEmail != "System Generated")
		{
			criteria = "((ZohoSign_Document_ID:equals:" + currentDocumentId + ") and (Email:equals:" + currentNotifiedEmail + "))";
			mp = {"module":"ZohoSign_Recipients","criteria":criteria};
			zohoSignRecipientsResponse = zoho.crm.invokeConnector("crm.search",mp).toString().toMap();
			sendmail
			[
				from :zoho.adminuserid
				to :"hariharasudhan.sk@zohocorp.com"
				subject :"1stopro TEST"
				message :"1stopro Criteria MAP signrecipients : " + mp + " and resp : " + zohoSignRecipientsResponse
			]
			if(zohoSignRecipientsResponse.get("response") != null)
			{
				response = zohoSignRecipientsResponse.get("response").toMap();
				if(response.get("data") != null)
				{
					data = response.get("data").toJSONList().toString().toMap();
					zohoSignDocumentEventsMap = Map();
					zohoSignDocumentEventsMap.put("Name",documentsEventsName);
					zohoSignDocumentEventsMap.put("ZohoSign_Documents",searchDocumentId);
					zohoSignDocumentEventsMap.put("Description",documentStatus.toUpperCase());
					zohoSignDocumentEventsMap.put("Date",curDate);
					zohoSignDocumentEventsMap.put("ZohoSign_Recipients",data.get("id"));
					zohoSignDocumentsEventsList = List();
					zohoSignDocumentsEventsList.add(zohoSignDocumentEventsMap);
					dataMap = {"module":"ZohoSign_Document_Events","data":zohoSignDocumentsEventsList};
					info "going to create ZohoSign_Document_Events module";
					zohoSignDocumentEventsRecord = zoho.crm.invokeConnector("crm.create",dataMap);
					sendmail
					[
						from :zoho.adminuserid
						to :"hariharasudhan.sk@zohocorp.com"
						subject :"1stopro TEST"
						message :"Criteria MAP createrecord : " + dataMap + " and resp : " + zohoSignDocumentEventsRecord
					]
				}
			}
		}
	}
}
actions = reqMap.get("actions").toJSONList();
for each  currentUser in actions
{
	currentUserMap = currentUser.toMap();
	currentUserEmail = currentUserMap.get("recipient_email");
	currentUserName = currentUserMap.get("recipient_name");
	currentUserActionStatus = currentUserMap.get("action_status");
	for each  documentId in documentIds
	{
		criteria = "((ZohoSign_Document_ID:equals:" + currentDocumentId + ") and (Email:equals:" + currentUserEmail + "))";
		mp = {"module":"ZohoSign_Recipients","criteria":criteria};
		zohoSignRecipientsResponse = zoho.crm.invokeConnector("crm.search",mp).toString().toMap();
		if(zohoSignRecipientsResponse.get("response") != null && zohoSignRecipientsResponse.get("response").length() > 3)
		{
			response = zohoSignRecipientsResponse.get("response").toMap();
			if(response.get("data") != null)
			{
				data = response.get("data").toJSONList().toString().toMap();
				updateData = Map();
				updateData.put("id",data.get("id"));
				updateData.put("Recipient_Status",currentUserActionStatus);
				dataList = List();
				dataList.add(updateData);
				updateMap = {"module":"ZohoSign_Recipients","data":dataList};
				info "going to update ZohoSign_Recipients module";
				updateResp = zoho.crm.invokeConnector("crm.update",updateMap);
				info "ZohoSign_Recipients Update : " + updateResp;
			}
		}
		else
		{
			info "zohoSignRecipientsSearchRecord is empty! Hence fetch from customview.";
			if(orgVar != null || orgVar != "")
			{
				authMap = Map();
				authMap.put("Authorization",orgVar);
				cv_res = getUrl("http://1stopro.zohoplatform.com/crm/v2/settings/custom_views?module=ZohoSign_Recipients",authMap);
				info "cv_res_1" + cv_res;
				respList = cv_res.get("custom_views").toJSONList();
				for each  customRec in respList
				{
					customRecMap = customRec.toMap();
					displayValue = customRecMap.get("display_value");
					info "displayValue :: " + displayValue;
					if(displayValue == "Recently Created ZohoSign Recipients")
					{
						cvid = customRec.get("id");
						info "cvid is :: " + cvid;
						break;
					}
				}
				if(cvid != null)
				{
					getRecords = getUrl("http://1stopro.zohoplatform.com/crm/v2/ZohoSign_Recipients?cvid=" + cvid,authMap);
					//info getRecords;
					//criteria = (((("((ZohoSign_Document_ID:equals:") + currentDocumentId) + ") and (Email:equals:") + currentUserEmail) + "))";
					getResult = getRecords.get("data");
					for each  record in getResult
					{
						info "Each Record: " + record;
						curUID = record.get("ZohoSign_Document_ID");
						curEmail = record.get("Email");
						if(curUID == currentDocumentId && curEmail == currentUserEmail)
						{
							searchRecipientId = record.get("id");
							info "(ZohoSign_Recipients)record id found under CVID api : " + searchRecipientId;
							//data = ((response.get("data").toJSONList()).toString()).toMap();
							updateData = Map();
							updateData.put("id",record.get("id"));
							updateData.put("Recipient_Status",currentUserActionStatus);
							dataList = List();
							dataList.add(updateData);
							updateMap = {"module":"ZohoSign_Recipients","data":dataList};
							info "going to update ZohoSign_Recipients module";
							updateResp = zoho.crm.invokeConnector("crm.update",updateMap);
							info "ZohoSign_Recipients Update : " + updateResp;
						}
					}
				}
			}
		}
	}
}
return "Success";