/*info crmAPIRequest;
sendmail
[
	from :zoho.adminuserid
	to :"hariharasudhan.sk@zohocorp.com"
	subject :"ProfessionalCoaching getMMTemplate Test!"
	message :crmAPIRequest.toString()
]
*/
moduleName = crmAPIRequest.get("params").get("module");
recordId = crmAPIRequest.get("params").get("recordId");
fileName = crmAPIRequest.get("params").get("fileName");
mailMerge_templateId = crmAPIRequest.get("params").get("templateId");
//templateId = crmAPIRequest.get("params").get("templateId");
info "ModuleName :: " + moduleName;
info "templateId :: " + mailMerge_templateId;
//tempList = zoho.crm.getTemplates(moduleName);
//info tempList;
//patientId = "3839889000000449641";
//mailMerge_templateId = 3839889000000410128;
//Need to Fix
mergeFile = zoho.crm.getMergedFile(moduleName,recordId,mailMerge_templateId);
info mergeFile;
//mergeFile.setParamName("content");
//fileName = mergeFile.getFileName();
//info "fileName is :: " + fileName;
//return mergeFile;
mergeFile.setParamName("content");
mergeFile.setFileName(fileName);
filesMap = Map();
filesMap.put("file",mergeFile);
dynamic_map = Map();
dynamic_map.put("CRMAPIFILES",filesMap);
info dynamic_map;
uploadFileResp = zoho.crm.invokeConnector("zohosign.uploadfile",dynamic_map);
info uploadFileResp;
return uploadFileResp;