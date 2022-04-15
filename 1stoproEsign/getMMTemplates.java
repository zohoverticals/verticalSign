moduleName = crmAPIRequest.get("params").get("module");
tempList = zoho.crm.getTemplates(moduleName);
return tempList;