var data = {};
var Utils ={};
var userArray = [];
var zsignUserArray = [];
var switchVar =0;
var moduleToFieldMap = {
    "Contacts": [
        "id",
        "Full_Name",
        "Email"
    ]
};
var userToFieldMap = {
    "Users":[
        "id",
        "full_name",
        "email"
    ]
};
var zsUserToFieldMap = {
    "users":[
        "user_id",
        "user_name",
        "user_email"
    ]
}
var zApiKey ;
var secondaryRecordsData = {};
var copySecondaryRecordsData = [];
var rowCounter = 0;
var customModuleNameToDetailMapping = {};
var zohoSignDocument, zohoSignRecipients, zohoSignDocumentsEvents;
var recipients = {};
var timeout = null;
var globalCallBackUrl;
var fileStream;
var authToken;
var DocsAuthToken = "";
var zsoid = "";
var fileName = "";
var templateId = "";
var configData = {};
var lookupRecData = {};
var orgResp = {};
var vcrmCompName;
$(document).click(function (e) {
    console.log(e.target);
    var curClass = e.target.getAttribute("id");

    var emailRows = $.find("[id*='emailRecip']")
    for(i=0;i<emailRows.length;i++){
        //var curRow = emailRows[i].id;
        //isHidden = $("#"+curRow).css("display");
        displayVal = $(emailRows[i]).css("display");
        if(displayVal != "none"){
            var container = jQuery(emailRows[i]);
            if(!container.is(e.target) && container.has(e.target).length === 0)
            {
                //var emailVal = $("#recipientMail").val();
                var emailDiv = $(container).find("[id*='recipientMail']");
                var emailVal = $(emailDiv).val();
                var errorDiv = $(container).find("[id*='error-message']")
                if(emailVal != ""){
                    if(!validateEmail(emailVal)){

                        $(errorDiv).show();
                        
                    }else{
                        
                        $(errorDiv).hide();
                    }
                }
                
            }
        }
    }    
});
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function initZohoSign() {   
     //$("#zhosingIN").hide();
     $("#DetailpageLoad").show();
    ZOHO.CRM.CONNECTOR.isConnectorAuthorized("zohosign").then(function(result)   // VerticalInventory Connector 
    {
        if(result == "false")
        {
            /*
            $("#auth").show();
            $(".btnbg").hide();
            $("#zhosingIN").hide();
            $("#DetailpageLoad").hide();
            
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                ZOHO.CRM.UI.Setting.open({"APIName":"e360crm__esignsetup1"})
            }, 500);
            
            setTimeout(function(){ ZOHO.CRM.UI.Setting.open({"APIName":"1stopro__esign"});
                ZOHO.CRM.UI.Popup.close(); 
            }, 5000);
            */
            ZOHO.CRM.CONNECTOR.authorize("zohosign").then(function(result)
            {                
                loadSignPage();
            },function(err)
            {
                console.log("ERRORRRRRRR");
                console.log(err);
                $("#auth").show();
                $(".btnbg").hide();
                $("#zhosingIN").hide();
                $("#DetailpageLoad").hide(); 
                $("#auth").text("Please contact your Administrator to Access Send for Sign");
            });
            
        }else{
            loadSignPage();
        }
    });
         
}
function loadSignPage(){
    $.getJSON("../lib/config.json",function(result){
            console.log(result);
            configData = result;
            console.log("Its Trigger!!");
            ZOHO.CRM.API.getAllUsers({Type:"ActiveConfirmedUsers"})
            .then(function(data){
                console.log(data);
                userArray=data.users;
            })
            ZOHO.CRM.CONNECTOR.invokeAPI("zohosign.gethostsusers",{})
                .then(function(result){
                    console.log("zsign user test:");
                    console.log(result);
                    var resp = JSON.parse(result.response);
                    code = resp.code;
                    if(code == 3001){
                        $("#auth").show();
                        $(".btnbg").hide();
                        $("#zhosingIN").hide();
                        $("#DetailpageLoad").hide(); 
                        $("#auth").text("Sign Account does not exist! Please contact your Administrator to Access Send for Sign");                   
                    }
                    allHosts = resp.hosts;
                    for(i=0;i<allHosts.length;i++){
                        //curUser = allHosts[i];
                        zsignUserArray.push(allHosts[i]);
                    }
                });
            /*ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.getusers,{})
                .then(function(result){
                    console.log("zsign user test:");
                    console.log(result);
                    var resp = JSON.parse(result.response);
                    code = resp.code;
                    if(code == 3001){
                        $("#auth").show();
                        $(".btnbg").hide();
                        $("#zhosingIN").hide();
                        $("#DetailpageLoad").hide(); 
                        $("#auth").text("Sign Account does not exist! Please contact your Administrator to Access Send for Sign");                   
                    }
                    allUsers = resp.users;
                    for(i=0;i<allUsers.length;i++){
                        curUser = allUsers[i];
                        if(curUser.is_allowed){
                            zsignUserArray.push(curUser);
                        }
                    }
                    //zsignUserArray = resp.users;
                }) */               
            ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.getfields,{})
                    .then(function(data) {
                            console.log("Authorization Done!! ");                            
                    },function(err)
                    {
                        console.log("ERRORRRRRRR");
                        if(err.code.startsWith("4") && err.message.toLowerCase().indexOf("auth") >= 0  )
                        {
                          $("#auth").show();
                          $(".btnbg").hide();
                          $("#zhosingIN").hide();
                          $("#DetailpageLoad").hide();              
                        }else{
                          $("#auth").hide();
                        }
                    })
                Promise.all([ZOHO.CRM.META.getModules(),ZOHO.CRM.CONFIG.GetCurrentEnvironment()]).then(function(response) {
                        /*ZOHO.CRM.API.getOrgVariable("DocsAuthToken").then(function(auth){ 
                         console.log(auth);
                            DocsAuthToken = auth.Success.Content;
                        });*/
                        ZOHO.CRM.CONFIG.getOrgInfo().then(function(orgVar){
                            console.log(orgVar);
                            zsoid = orgVar.org[0].zgid;
                            vcrmCompName = orgVar.org[0].company_name;
                            ZOHO.CRM.CONNECTOR.invokeAPI("zohosign.getorgdetails",{})
                            .then(function(result){
                                console.log(result);
                                var status_code = result.status_code;
                                if(status_code >=200 && status_code <300){
                                    orgResp = JSON.parse(result.response);
                                    delete orgResp['code'];
                                    delete orgResp['message'];
                                    delete orgResp['status'];
                                console.log("orgResp");
                                    orgName = orgResp.org_details.org_name;
                                    if(vcrmCompName.toUpperCase() !== orgName.toUpperCase() ){                                        
                                        console.log("YES")                
                                        orgResp.org_details.org_name=vcrmCompName;
                                        encodeOrgDetails = {};
                                        encodeOrgDetails.data = encodeURIComponent(JSON.stringify(orgResp));
                                        console.log("Before ENCODE::");
                                        console.log(orgResp);
                                        console.log("Afer ENCODE::");
                                        console.log(encodeOrgDetails); 
                                        ZOHO.CRM.CONNECTOR.invokeAPI("zohosign.updateorgdetails",encodeOrgDetails)
                                        .then(function(result){
                                            //alert("orgName Updated Successfully");
                                            console.log(result);
                                        });                            
                                    }
                                }
                            });
                            var settingmap = {};
                            settingmap.settings="settings";
                            ZOHO.CRM.CONNECTOR.invokeAPI("zohosign.getReminderSettings",settingmap)
                            .then(function(myres){
                                console.log(myres);
                                console.log("my getsettins result ::");
                                var status_code = myres.status_code;
                                if(status_code >=200 && status_code <300){
                                    settingsResp = JSON.parse(myres.response);
                                    remiderVal = settingsResp.settings.reminders_settings.email_reminders;
                                    if(remiderVal){
                                        settingsResp.settings.reminders_settings.email_reminders=true;
                                        var map = {};
                                        map.settings="settings";
                                        map.data = {};
                                        var j = {"settings":{"reminders_settings":{"email_reminders":false,"reminder_period":15},"request_default":{"send_mail_from":2,"authentication_offline":true,"send_completed_document_to":0,"authentication_mandatory":false,"embed_document_id":true,"expiration_days":15,"authentication_email":true,"is_sequential":true,"send_completed_document_as":0,"embed_document_id_page_config":0,"authentication_sms":true,"embed_document_id_position_config":0,"add_in_blockchain":false,"send_completion_certificate_to":1}}}                                        
                                        map.data = encodeURIComponent(JSON.stringify(j));
                                        ZOHO.CRM.CONNECTOR.invokeAPI("zohosign.updateremindersettings",map).then(function(myupdRes){                                            
                                            console.log("reminder is stopped!");
                                            console.log(myupdRes);
                                        })
                                    }
                                }
                            })
                            ZOHO.CRM.CONNECTOR.invokeAPI("zohosign.getmailtemplatestatus",{})
                            .then(function(result){
                                console.log(result);
                                var status_code = result.status_code;
                                if(status_code >=200 && status_code <300){
                                    mailResp = JSON.parse(result.response);
                                    console.log("mailResp");
                                    console.log(mailResp);
                                    isCustomEmailSet = mailResp.branding_settings.custom_email;
                                    if(!isCustomEmailSet){
                                        delete mailResp['code'];
                                        delete mailResp['message'];
                                        delete mailResp['status'];
                                        delete mailResp.branding_settings.logo_url;
                                        mailResp.branding_settings.custom_email = true;
                                        encodeTempDetails = {};
                                        encodeTempDetails.data = encodeURIComponent(JSON.stringify(mailResp));
                                        console.log("Before ENCODE::");
                                        console.log(mailResp);
                                        console.log("Afer ENCODE::");
                                        console.log(encodeTempDetails); 
                                        ZOHO.CRM.CONNECTOR.invokeAPI("zohosign.updatemailtemplate",encodeTempDetails)
                                        .then(function(result){
                                            //alert("orgName Updated Successfully");
                                            console.log(result);
                                            modifyEmailTemplate();
                                        });
                                    }
                                    else{
                                        modifyEmailTemplate();
                                    }                                    
                                }
                            });
                        });
                    if(switchVar == 0)
                    {
                        var modulesData = response[0].modules;
                        generateModuleNameToDetailMapping(modulesData);
                        if(data.pageLoadData.Entity.includes("Contacts") || data.pageLoadData.Entity.includes("Leads"))
                        {
                            $("#DetailpageLoad").hide();
                            var value ;
                            ZOHO.CRM.API.getRecord({Entity:data.pageLoadData.Entity,RecordID:data.pageLoadData.EntityId[0]})
                            .then(function(data){
                                //data.pageLoadData.recordDetail = recdetails;
                                lookupRecData = data.data[0];
                                value = "{"+data.data[0].Full_Name+"}"+data.data[0].Email;
                                addrecipient(undefined,1,value);
                            })

                        }
                        else if(data.pageLoadData.Entity.includes("Deals")  || data.pageLoadData.Entity.includes("Contract_Changes"))
                        {
                            ZOHO.CRM.API.getRecord({Entity:data.pageLoadData.Entity,RecordID:data.pageLoadData.EntityId[0]})
                            .then(function(data){ 
                                $("#DetailpageLoad").hide();                               
                                recdetails = data.data[0];
                                //data.pageLoadData.recordDetail = recdetails;
                                recStatus = recdetails.Status;
                                if(recStatus == "Signed"){
                                    $("#status").show();
                                    $(".btnbg").hide();
                                    $("#zhosingIN").hide();                                    
                                    return;
                                }
                                lookupRecData = recdetails;
                                Contact_Name = recdetails.Contact_Name;
                                if(Contact_Name == null || Contact_Name == undefined)
                                {
                                    value = "No Contact Found";
                                    addrecipient(undefined,1,value);
                                }else{
                                    contactId = Contact_Name.id;
                                    ZOHO.CRM.API.getRecord({Entity:"Contacts",RecordID:contactId})
                                    .then(function(data){
                                        value = "{"+data.data[0].Full_Name+"}"+data.data[0].Email;
                                        addrecipient(undefined,1,value);
                                    });
                                    
                                }
                                
                            })
                        }
                       if(response[1].appDetails != undefined)
                       {
                            var appUrl = response[1].appDetails.url;
                            var appDomain = appUrl.split("//")[1].split(".")[0];
                            var protocol = appUrl.split(":")[0];
                            var simpleUrl = appUrl.split(":")[1];

                            protocol = protocol.substring(0,4);
                            //appUrl = protocol+":"+simpleUrl;
                            appUrl = configData.customFunctions.appName;
                            ZOHO.CRM.CONNECTOR.invokeAPI("crm.zapikey",{"nameSpace" : "vcrm_"+appDomain}).then(function(zApiKeyData)
                            {
                                var tempZApiKeyResponse = JSON.parse(zApiKeyData);
                                if(tempZApiKeyResponse.response != "No key found")
                                {
                                    zApiKey = tempZApiKeyResponse.response;
                                    //globalCallBackUrl = appUrl+"/crm/v2/settings/custom_functions/zohosigncallback/execute?zapikey="+zApiKey+"&useProxy=true";
                                    globalCallBackUrl = appUrl+configData.customFunctions.callBackURL+zApiKey+"&useProxy=true";
                                    //globalCallBackUrl = "http://eapp.localzohoplatform2.com/crm/v2/settings/custom_functions/zohosigncallback/execute?zapikey="+zApiKey+"&useProxy=true";
                                }
                                else
                                {
                                    zApiKey = undefined;
                                    //globalCallBackUrl = appUrl+"crm/v2/functions/zohosigncallback/actions/execute?auth_type=apikey&zapikey=1001.ef4daa7f8346b09bcb6f572e01ff028c.4cf49461b458d9bb6faec01f1dfc43d1";
                                    globalCallBackUrl = appUrl+"/crm/v2/functions/e360crm__zohosign_callbackfunction/actions/execute?auth_type=apikey&useProxy=true";
                                    //globalCallBackUrl = "http://eapp.localzohoplatform2.com/crm/v2/settings/custom_functions/zohosigncallback/execute?useProxy=true";
                                }
                            });
                       }else{
                        globalCallBackUrl = "https://1stopro.zohosandbox.com/crm/v2/functions/1stopro__zohosign_callbackfunction/actions/execute?auth_type=apikey&zapikey=1003.03ec0b861f73ba5d5d3fd454a4d62130.6cfb70a47ff040ef9a2b61a6444f216e&useProxy=true";//"https://e360crm.zohosandbox.com/crm/v2/functions/zohosign_callbackfunction/actions/execute?auth_type=apikey&zapikey=1001.7e11529cc983ce77ec32c60658631d0b.61b72295d632a645b2f5d1f71da85c10&useProxy=true"
                       }
                        switchVar = 1;
                    }
                }) 
        })
}
function modifyEmailTemplate(){
    var emailData= {"accounts":{"subject":"$SENDER_NAME$ from $ORG_NAME$ requests your signature","mail_template":"<div class=\"container\" style=\"width: 100% !important; line-height: 1.6em; font-size: 14px; background-color: rgb(246, 246, 246); padding-top: 20px\"><table style=\"background-color: rgb(246, 246, 246); width: 600px; margin: 0 auto !important\"><tbody><tr><td><br></td><td style=\"display: block !important; width: 600px !important; margin: 0 auto !important; clear: both !important\" class=\"templateColumns\"><div style=\"margin: 0 auto; display: block\"><table style=\"background-color: rgb(255, 255, 255)\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td style=\"font-size: 16px; font-weight: 500; padding: 20px; line-height: 18px; background-color: rgb(255, 255, 255)\"><img src=\"$LOGO_URL$\" id=\"ztb-logo-rebrand\" style=\"max-height: 50px\"><br></td></tr><tr><td><table width=\"100%\" align=\"center\" cellpadding=\"10\" cellspacing=\"0\" style=\"background-color: rgb(81, 210, 182)\"><tbody><tr><td style=\"color: rgb(255, 255, 255); font-size: 16px; font-family: Helvetica, Arial, Sans Serif; border: none; background-color: rgb(81, 210, 182); padding: 20px; height: 28px\" class=\"header-row\"><div style=\"text-align: left; float: left; line-height: normal; padding: 0px 0 0 10px; display: inline-block; font-size: 24px; width: 100%\" class=\"sign-mail-header\">Digital Signature Request<br></div></td></tr></tbody></table></td></tr><tr><td style=\"padding: 25px 40px 0px 40px\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding-bottom: 20px\"><tbody style=\"font-size: 14px; color: rgb(68, 68, 68); line-height: 20px\"><tr><td style=\"padding: 0 0 20px; font-size: 14px\" class=\"message-row\"><div class=\"sign-mail-message\" style=\"word-wrap: break-word; width: 100%; float: left\"><span>$SENDER_NAME$ from $ORG_NAME$ has requested you to review and sign $DOCUMENT_NAME$</span><br></div></td></tr><tr><td><table style=\"width: 100%; table-layout: fixed\"><tbody><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Sender<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$SENDER_EMAIL$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Organization Name<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$ORG_NAME$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Expires on<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$EXPIRY_DATE$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px; vertical-align: top\"><td width=\"35%\" style=\"font-weight: 600\">Message to all<br></td><td>$NOTE$<br></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"padding: 0 0 20px\"><table width=\"100%\"><tbody><tr><td align=\"center\" style=\"padding-top: 15px\"><div><table><tbody><tr><td align=\"center\" style=\"font-size: 15px; color: rgb(255, 255, 255); background-color: rgb(232, 78, 88); text-align: center; text-decoration: none; border-radius: 2px; display: inline-block; min-height: 38px\" class=\"button-row\"><a class=\"sign-mail-btn-link\" href=\"$LINK_TO_SIGN$\" style=\"font-size: 18px; color: rgb(255, 255, 255); text-align: center; text-decoration: none; border-radius: 3px; display: inline-block; padding: 0px 30px; float: left\" rel=\"noopener noreferrer\" target=\"_blank\"><div style=\"line-height: 38px; font-size: 18px\" class=\"sign-mail-btn-text\">Start Signing<br></div></a></td></tr></tbody></table></div></td></tr></tbody></table></td></tr></tbody></table></div></td><td><br></td></tr></tbody></table><div class=\"disclaimer-container\" style=\"background-color: #f6f6f6;width: 600px;padding: 10px 0px 20px 0px;margin: 0 auto;\">$FOOTER_CONTENT$</div></div><div><br></div><style type=\"text/css\">@media only screen and (max-width: 480px) {.templateColumns { width: 100% !important } }<br></style>","file_name":"SIGN_MAIL_TEMPLATE","language":"en"}};
    var encodeEmailData = {};
    encodeEmailData.data = encodeURIComponent(JSON.stringify(emailData));
    ZOHO.CRM.CONNECTOR.invokeAPI("zohosign.updateemailtemplate",encodeEmailData)
    .then(function(result){
        //alert("email template Updated Successfully");
        console.log(result);       
    });
}

/*function populateUserUI(response,rowNumber){
    //userToFieldMap
    $("#select_row_" + rowNumber).html('');
    copySecondaryRecordsData = userArray;
    populateUserSelect(rowNumber);

}*/
function populateUI(response, rowNumber) {
    secondaryRecordsData = {};
    copySecondaryRecordsData = {};
    $("#select_row_" + rowNumber).html('');
    secondaryRecordsData = response[1].data !== undefined ? response[1].data : {};
    if (response[0].data !== undefined) {
        if (jQuery.isEmptyObject(secondaryRecordsData)) {
            secondaryRecordsData = response[0].data;
        } else {
            secondaryRecordsData.concat(response[0].data);
        }
    }
    copySecondaryRecordsData = secondaryRecordsData.concat();
    populateSelect(rowNumber);
}

function generateModuleNameToDetailMapping(modulesData) {
    for (var _i = 0; _i < modulesData.length; _i++) {
        var currentModuleData = modulesData[_i];
        if (currentModuleData.module_name.toUpperCase().includes("CUSTOMMODULE")) {
            customModuleNameToDetailMapping[currentModuleData.module_name + "_" + currentModuleData.api_name + "1"] = currentModuleData;
        }
    }
}
function populateUserSelect(rowNumber){
    $("#select_row_" + rowNumber).html('');
    var select = $("#select_row_" + rowNumber);
    var modName = userToFieldMap["Users"];
    var option = $('<option/>').attr({
        id:'label_default',
        value: 'Choose Recipient'
    }).text('Choose Recipient').appendTo(select);

    for(var i=0;i<copySecondaryRecordsData.length; i++){
        option = $('<option/>').attr({
            id: 'label_' + copySecondaryRecordsData[i][modName[0]],
            value: copySecondaryRecordsData[i][modName[1]] + "-" + copySecondaryRecordsData[i][modName[2]]
        }).text(copySecondaryRecordsData[i][modName[1]] + "-" + copySecondaryRecordsData[i][modName[2]]).appendTo(select);
    }
    var option = $('<option/>').attr({
        id: 'label_newRecipient',
        value: '+ New Recipient'
    }).text('+ New Recipient').appendTo(select);
    showSelectBOx();
}
function populate_zsUserSelect(rowNumber){
    $("#select_row_" + rowNumber).html('');
    var select = $("#select_row_" + rowNumber);
    var modName = zsUserToFieldMap["users"];
    var option = $('<option/>').attr({
        id:'label_default',
        value: 'Choose ZohoSign Recipient'
    }).text('Choose ZohoSign Recipient').appendTo(select);

    for(var i=0;i<copySecondaryRecordsData.length; i++){
        option = $('<option/>').attr({
            id: 'label_' + copySecondaryRecordsData[i][modName[0]],
            value: copySecondaryRecordsData[i][modName[1]] + "-" + copySecondaryRecordsData[i][modName[2]]
        }).text(copySecondaryRecordsData[i][modName[1]] + "-" + copySecondaryRecordsData[i][modName[2]]).appendTo(select);
    }
    showSelectBOx();
}
function populateSelect(rowNumber) {
    var select = $("#select_row_" + rowNumber);
    var moduleName = moduleToFieldMap["Contacts"];
    var option = $('<option/>').attr({
        id: 'label_default',
        value: 'Choose Recipient'
    }).text('Choose Recipient').appendTo(select);
    for (var _i = 0; _i < copySecondaryRecordsData.length; _i++) {
        option = $('<option/>').attr({
            id: 'label_' + copySecondaryRecordsData[_i][moduleName[0]],
            value: copySecondaryRecordsData[_i][moduleName[1]] + "-" + copySecondaryRecordsData[_i][moduleName[2]]
        }).text(copySecondaryRecordsData[_i][moduleName[1]] + "-" + copySecondaryRecordsData[_i][moduleName[2]]).appendTo(select);

    }
    showSelectBOx();
}

function remove(currentRow) {
    $(currentRow).closest('tr').remove();
}
function addInperson(_this){

    var val = $(_this).children(":selected").attr("id");
    var rowNumber = $(_this).attr("id").split("_")[2];
    if(val == 'INPERSONSIGN'){
        $("#hostDiv"+rowNumber).show();
        $("#SignerDiv"+rowNumber).show();
    }else{
        $("#hostDiv"+rowNumber).hide();
        $("#SignerDiv"+rowNumber).hide();
    }
}
function addRecord(rowNumber,flag,value) {
    var tr = $("#tr_row_" + rowNumber);
    var select = $("#select_row_" + rowNumber);    
    var signOrder = $("#signOrder_row_" + rowNumber);
    var signerRole = $("#signerRole_row_" + rowNumber);
    var removeBtn = $("#remove_row_" + rowNumber);
    var currentAddRecordCheckBoxId;
    var recipVal = $(select).children(":selected").text()

    if(flag == 0)
    {
        if(recipVal == "+ New Recipient")
        {
            //$("#recipientMail_"+rowNumber).show();
            $("#emailRecip_"+rowNumber).show();
            $("#div_pselect_row_"+rowNumber).hide();
            currentAddRecordCheckBoxId = rowNumber;
            //return;
        }else{
         currentAddRecordCheckBoxId = $(select).children(":selected").attr("id").split("_")[1];
        }
    }
    else
    {
        currentAddRecordCheckBoxId = data.pageLoadData.EntityId[0];
        $(select).children(":selected").val(value);
        $(select).children(":selected").text(value);
    }
    $(select).attr("disabled", "disabled");
    $(tr).attr("id", "tr_row_" + rowNumber + "_" + currentAddRecordCheckBoxId);
    $(select).attr("id", "select_row_" + rowNumber + "_" + currentAddRecordCheckBoxId);
    $(signOrder).attr("id", "signOrder_row_" + rowNumber + "_" + currentAddRecordCheckBoxId);
    $(signerRole).attr("id", "signerRole_row_" + rowNumber + "_" + currentAddRecordCheckBoxId);
    $(removeBtn).attr("id", "remove_row_" + rowNumber + "_" + currentAddRecordCheckBoxId);
    showSelectBOx();
}

function toggleSignOrder() {
    if ($('#signOrderCheckBox').is(':checked')) {
        $("input[id*='signOrder_row_']").removeAttr("disabled");
    } else {
        $("[id*='signOrder_row_']").attr("disabled", "disabled");
    }
    showSelectBOx();
}

function showSelectBOx() {
    $(".pSelect select").chosen({
        width: '100%'
    }); //No I18N
    $(".pSelect select").trigger("chosen:updated"); //No I18N
}

function addrecipient(obj,flag,value) {
    showSelectBOx();
        //var tr = '<tr class="item" id="tr_row_' + (++rowCounter) + '"> <td class="itemName" id="td_row_' + (rowCounter) + '"> <div> <span id="SignerDiv' + (rowCounter) + '" style="display:none;margin-bottom: 10px;">Signer &gt;&gt;</span> <div class="pSelect" id="div_pselect_row_' + (rowCounter) + '"> <select class="squer dropDownRecipients" id="select_row_' + (rowCounter) + '" name="recipients" onchange="addRecord(rowCounter,0,undefined)"> <option>Search Recipient</option> </select> </div> </div> <div id="hostDiv' + (rowCounter) + '" style="display:none;margin-top: 10px;"> <span>Host (Mandatory) &gt;&gt;</span><div><input class="host_text" type="text" placeholder="Host Email" id="hostEmail' + (rowCounter) + '"><input class="host_text" type="text" placeholder="Host Name" id="hostName' + (rowCounter) + '"></div></div> </td> <td class="itemQty"> <div class="formInputBox pT0"><input class="textField" disabled="disabled" type="text" placeholder="Choose Order" id="signOrder_row_' + (rowCounter) + '" /></div> </td> <td class="itemPrice"> <div class="pSelect w200 noSearch"> <select class="primarySignerRole" id="signerRole_row_' + (rowCounter) + '" onchange="addInperson(this)"> <option id="sign" value="Sign" name="sign">Sign</option> <option id="view" value="View" name="View">View</option> <option id="INPERSONSIGN" value="INPERSONSIGN" name="INPERSONSIGN">In-person signer</option> </select> </div> </td> <td class="pR oH"><a href="javascript:;" id="remove_row_' + (rowCounter) + '" onclick="remove(this)" class="remove">Remove</a></td></tr>'
        //var tr = '<tr class="item" id="tr_row_' + (++rowCounter) + '"> <td class="itemName" id="td_row_' + (rowCounter) + '"> <div> <span id="SignerDiv' + (rowCounter) + '" style="display:none;margin-bottom: 10px;">Signer &gt;&gt;</span> <div class="pSelect" id="div_pselect_row_' + (rowCounter) + '"> <select class="squer dropDownRecipients" id="select_row_' + (rowCounter) + '" name="recipients" onchange="addRecord(rowCounter,0,undefined)"> <option>Search Recipient</option> </select> </div> </div> <div id="hostDiv' + (rowCounter) + '" style="display:none;margin-top: 10px;"> <span>Host (Mandatory) &gt;&gt;</span><div class="pSelect" id="div_zsuser_pselect_row_' + (rowCounter) + '"> <select class="squer dropDownRecipients1" id="select_zsuser_row_' + (rowCounter) + '" name="recipients" onchange="addZSignRecord(rowCounter,0,undefined)"> <option>Search ZSignn Recipient</option> </select> </div></div> </td> <td class="itemQty"> <div class="formInputBox pT0"><input class="textField" disabled="disabled" type="text" placeholder="Choose Order" id="signOrder_row_' + (rowCounter) + '" /></div> </td> <td class="itemPrice"> <div class="pSelect w200 noSearch"> <select class="primarySignerRole" id="signerRole_row_' + (rowCounter) + '" onchange="addInperson(this)"> <option id="sign" value="Sign" name="sign">Sign</option> <option id="view" value="View" name="View">View</option> <option id="INPERSONSIGN" value="INPERSONSIGN" name="INPERSONSIGN">In-person signer</option> </select> </div> </td> <td class="pR oH"><a href="javascript:;" id="remove_row_' + (rowCounter) + '" onclick="remove(this)" class="remove">Remove</a></td></tr>'
        var tr = '<tr class="item" id="tr_row_' + (++rowCounter) + '"> <td class="itemName" id="td_row_' + (rowCounter) + '"> <div> <span id="SignerDiv' + (rowCounter) + '" style="display:none;margin-bottom: 10px;">Signer &gt;&gt;</span> <div id="emailRecip_' + (rowCounter) + '" style="display:none;"><input class="recipText" type="text" name="recipientMail" placeholder="Enter recipient email" id="recipientMail_' + (rowCounter) + '" /><div class="error-message" id="error-message_' + (rowCounter) + '"> <span class="error-text">* Invalid EmailId.</span></div><input class="recipText" type="text" name="recipientName" placeholder="Enter recipient name" id="recipientName_' + (rowCounter) + '" /></div> <div class="pSelect" id="div_pselect_row_' + (rowCounter) + '"> <select class="squer dropDownRecipients" id="select_row_' + (rowCounter) + '" name="recipients" onchange="addRecord('+(rowCounter)+',0,undefined)"> <option>Search Recipient</option> <option>+ New Recipient</option> </select> </div> </div> <div id="hostDiv' + (rowCounter) + '" style="display:none;margin-top: 10px;"> <span>Host (Mandatory) &gt;&gt;</span><div><input type="hidden" id="input_' + (rowCounter) + '" name="hiddenText" value="None"/><select class="select_zsuser_row" id="select_zsuser_row_' + (rowCounter) + '" onclick="onFocusFn(this);" onchange="setUsers(this);"><option value="None">--None--</option></select></div></div> </td> <td class="itemQty"> <div class="formInputBox pT0"><input class="textField" disabled="disabled" type="text" placeholder="Choose Order" id="signOrder_row_' + (rowCounter) + '" /></div> </td> <td class="itemPrice"> <div class="pSelect w200 noSearch"> <select class="primarySignerRole" id="signerRole_row_' + (rowCounter) + '" onchange="addInperson(this)"> <option id="sign" value="Sign" name="sign">Sign</option> <option id="view" value="View" name="View">View</option> <option id="INPERSONSIGN" value="INPERSONSIGN" name="INPERSONSIGN">In-person signer</option> </select> </div> </td> <td class="pR oH"><a href="javascript:;" id="remove_row_' + (rowCounter) + '" onclick="remove(this)" class="remove">Remove</a></td></tr>'
        $('#addRec tbody').append(tr);
        if ($('#signOrderCheckBox').is(':checked')) {
            $("#signOrder_row_" + rowCounter).removeAttr("disabled");
        }
    if(flag)
    {
        addRecord(rowCounter,flag,value);    
    }
    for(i=0;i<zsignUserArray.length;i++){
        $("#select_zsuser_row_"+rowCounter).append('<option value="' + zsignUserArray[i].email + '-'+ zsignUserArray[i].name + '">' + zsignUserArray[i].email +'-'+ zsignUserArray[i].name + '</option>');
    }
    showSelectBOx();
}

function getMetaData(name) {
    var keys = Object.keys(customModuleNameToDetailMapping);
    for (var _i = 0; _i < keys.length; _i++) {
        if (keys[_i].includes(name)) {
            return customModuleNameToDetailMapping[keys[_i]];
        }
    }
}

function toggleGIF() {
    $("#submit14").show();
    $("#loadingGif").hide();
}

function processForm() {    
    console.log("Harry!");
    var emailRows = $.find("[id*='emailRecip']")
    for(i=0;i<emailRows.length;i++){
        //var curRow = emailRows[i].id;
        //isHidden = $("#"+curRow).css("display");
        displayVal = $(emailRows[i]).css("display");
        if(displayVal != "none"){
            var container = jQuery(emailRows[i]);
            var errorDiv = $(container).find("[id*='error-message']")
            var emailDiv = $(container).find("[id*='recipientMail']");
                var emailVal = $(emailDiv).val();

                if(emailVal != ""){
                    if(!validateEmail(emailVal)){
                        alert("Invalid Entry. Kindly fill the form fully.");
                        //alert("Fill the form fully!");
                        toggleGIF();
                        $(errorDiv).show();
                        return;                      
                    }
                }
        }
    }
    var file;
    if(document.getElementById("file").files[0] != undefined)
    {
        file = document.getElementById("file").files[0];
    }
    else if(fileStream != undefined)
    {
        file = fileStream;
    }
    if(file == undefined && fileStream == undefined)
    {
        $("#submit14").hide();
        $("#loadingGif").show();
        $("#Loading").show();
        $("#Loading").text("Processing Mail Merge Execution!");
        console.log("Upload From MailMerge Templates...");
        module = data.pageLoadData.Entity;
        recordId = data.pageLoadData.EntityId[0];
        params = {"module":module,"recordId":recordId,"templateId":templateId,"fileName":fileName};
        //https://professionalcoaching.zohosandbox.com/crm/v2/functions/professionalcoaching__getmergefile/actions/execute?auth_type=apikey&zapikey=1001.7e11529cc983ce77ec32c60658631d0b.61b72295d632a645b2f5d1f71da85c10
        //ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getMergeFile,params).then(function(data){
            ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getMergeFile,params).then(function(data){             
            console.log(data);
            code = data.code;
                if("success" == code)
                {
                    $("#Loading").text("Processing Sign Request!");
                    var templateData = {};
                    output = data.details.output;
                    console.log(output);

                    var jsonOutput = JSON.parse(output);
                    var response = JSON.parse(jsonOutput.response);

                    var requestId = response.requests.request_id;
                    /*** Use existing code ***/
                    var updateRecipientsData = {
                        "reqid": requestId,
                    }
                    var updateDataGenerator = {};
                    var signOrderSet = 0;
                    if ($('#signOrderCheckBox').is(':checked')) {
                        signOrderSet = 1;
                    }
                    /*
                    setReminder = 0;
                    if($('#toggle_reminder').is(':checked')){
                        setReminder = 1;
                    }
                    */
                    generateActions(updateDataGenerator, signOrderSet);
                    if($("#docuName").val().trim() != ""){
                        updateDataGenerator.request_name = $("#docuName").val();
                    }
                    
                    updateDataGenerator.notes = $("#notesArea").val();
                    updateDataGenerator.description = $("#descriptionArea").val();
                    if (signOrderSet == 1) {
                        updateDataGenerator.is_sequential = true;
                    }
                    updateDataGenerator.email_reminders = false;
                    updateDataGenerator.reminder_period = 15;
                    /*
                    if(setReminder == 1)
                    {
                        updateDataGenerator.email_reminders = true;
                        remVal = $("#reminder_frequency_text").val();
                        if(remVal > 0)
                        {
                            console.log("donothing!");
                        }
                        updateDataGenerator.reminder_period = $("#reminder_frequency_text").val();
                    }else{
                        updateDataGenerator.email_reminders = false;
                        updateDataGenerator.reminder_period = 0;
                    }
                    */
                    //expiresIn
                    expiresVal = $("#expiresIn").val();
                    if(isNaN(expiresVal)){
                        updateDataGenerator.expiration_days = 15;
                    }else{
                        updateDataGenerator.expiration_days = parseInt(expiresVal);                        
                    }
                    var requestsJson = {};
                    requestsJson.requests = updateDataGenerator;
                    updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));
                    var currentDomain = document.referrer;
                    updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                    ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.updaterecipient, updateRecipientsData)
                        .then(function(data) {
                            if (data.status_code == "200") {
                                var response = JSON.parse(data.response);
                                console.log("updaterecipient 1 :: "+response);
                                //populateZohoSignDocuments(response, file);
                                $("#Loading").text("Send for E-Sign recipients updation is in progress...");
                                var recipientResp = response.requests;
                                docIdList = recipientResp.document_ids;                                
                                newReciep = generateFields(recipientResp,docIdList);
                                console.log(newReciep);
                                var actionMap = {};
                                actionMap.actions=newReciep;
                                var requestId = recipientResp.request_id;
                                var updateRecipientsData = {
                                    "reqId": requestId,
                                }
                                var requestsJson = {};
                                requestsJson.requests = actionMap;
                                //requestsJson.requests.request_name = "Note";
                                console.log("before encode :: ");
                                console.log(requestsJson);
                                updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));
                                console.log("After encode :: ");
                                console.log(updateRecipientsData);
                                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.sendsignrequest, updateRecipientsData)
                                .then(function(data) {

                                    console.log("sendsignrequest inventory merge template::: ");
                                    console.log(data);
                                    
                                    if(data.status_code < 300){
                                        //alert("inventory sendsignrequest is done!");
                                        $("#Loading").text("MM sendsignrequest is done!");
                                    }
                                    else{
                                        //alert("error in inventory sendsignrequest!!");
                                        r = data.response;
                                        code = JSON.parse(r).code;
                                        if(code == 9101){
                                            $("#Loading").text("Error in mailmerge template sendsignrequest! Kindly add atleast one field for a signer.");
                                        }else{
                                            $("#Loading").text("Error in MM sendsignrequest!");
                                        }
                                        
                                    }
                                    
                                });
                                populateZohoSignDocuments(response, file);

                            } else {
                                alert("Error in updateRecipients");
                                toggleGIF();
                            }
                        })
                    
                }else if("INVALID_DATA" == code){
                    $("#Loading").text("No file is selected in the sign request, kindly select a file and proceed!");
                    $("#Loading").css({"color": "#ff0000"});
                    toggleGIF();
                    setTimeout(function() {
                        $("#Loading").css({"color": "black"});
                        $("#Loading").hide();
                    }, 4000);
                }
        });

    }
    else if (file != undefined && $.find("[id*='tr_row_']").length > 0) 
    {
        $("#submit14").hide();
        $("#loadingGif").show();
        $("#Loading").show();
        $("#Loading").text("File Upload is in progress...");
        var fileType;
        if (file.type === "application/pdf"){
            fileType = file.type;
        }
        else if(file.type === "image/jpeg"){
            fileType = file.type;
        }
        else if(file.type === "text/plain"){
            fileType = "application/msword";
        }
        else if(file.type === ""){
            fileType = "application/msword";
        }
        var data1 = {
            "CONTENT_TYPE":"multipart",
            "PARTS":[
                  {
                    "headers": {  
                      "Content-Type": "application/json"
                    },
                    "content": {"mimeType": fileType,"description": "TestFile to upload", "title":file.name}
                  },{
                    "headers": {
                      "Content-Disposition": "file;"
                    },
                    "content": "__FILE__"
                  }
                ],
            "FILE":{
             "fileParam":"content",
             "file":file
        },
      };
        var uploadDocumentData = {
            "CONTENT_TYPE": "multipart",
            "PARTS": [{
                "headers": {
                    "Content-Disposition": "form-data; name=file; filename=" + file.name,
                    "Content-Type": "multipart/form-data; charset=ISO-8859-1",
                    
                },
                "content": "__FILE__"
            }],
            "FILE": {
                "fileParam": "content",
                "file": file,
            }
        }
// var request ={
//         url : "https://sign.localzoho.com/api/v1/requests",
//         headers:{
//             Authorization:"Zoho-oauthtoken 1000.2ac67ba1ed4b5bdffcddbf973e0eb25a.c3e02905768cd68ec5f1cdde817c7201",
//             "Content-Type":"multipart/form-data"

//         },
//         body : {
//             file:file
//         }
// }
// ZOHO.CRM.HTTP.post(request)
// .then(function(data){
//     console.log(data)
// })
        ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.uploadFile, uploadDocumentData)
            .then(function(data) {

                if (data.status_code == "200") {
                    debugger;
                    var response = JSON.parse(data.response);
                    console.log("uploadFIle RESP : "+response);
                    $("#Loading").text("Send for E-Sign data population is in progress...");
                    var requestId = response.requests.request_id;
                    var updateRecipientsData = {
                        "reqid": requestId,
                    }
                    var updateDataGenerator = {};
                    var signOrderSet = 0;
                    if ($('#signOrderCheckBox').is(':checked')) {
                        signOrderSet = 1;
                    }
                    /*
                    setReminder = 0;
                    if($('#toggle_reminder').is(':checked')){
                        setReminder = 1;
                    }
                    */
                    generateActions(updateDataGenerator, signOrderSet);
                    if($("#docuName").val().trim() != ""){
                        updateDataGenerator.request_name = $("#docuName").val();
                    }
                    
                    updateDataGenerator.notes = $("#notesArea").val();
                    updateDataGenerator.description = $("#descriptionArea").val();
                    if (signOrderSet == 1) {
                        updateDataGenerator.is_sequential = true;
                    }
                    updateDataGenerator.email_reminders = false;
                    updateDataGenerator.reminder_period = 15;
                    /*
                    if(setReminder == 1)
                    {
                        updateDataGenerator.email_reminders = true;
                        remVal = $("#reminder_frequency_text").val();
                        if(remVal > 0)
                        {
                            console.log("donothing!");
                        }
                        updateDataGenerator.reminder_period = $("#reminder_frequency_text").val();
                    }else{
                        updateDataGenerator.email_reminders = false;
                        updateDataGenerator.reminder_period = 0;
                    }
                    */
                    //expiresIn
                    expiresVal = $("#expiresIn").val();
                    if(isNaN(expiresVal)){
                        updateDataGenerator.expiration_days = 15;
                    }else{
                        updateDataGenerator.expiration_days = parseInt(expiresVal);                        
                    }

                    var requestsJson = {};
                    requestsJson.requests = updateDataGenerator;
                    updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));
                    var currentDomain = document.referrer;
                    updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                    ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.updaterecipient, updateRecipientsData)
                        .then(function(data) {
                            if (data.status_code == "200") {
                                debugger;
                                var response = JSON.parse(data.response);
                                console.log("updaterecipient 2 :: "+response);
                                var recipientResp = response.requests;
                                docIdList = recipientResp.document_ids;                                
                                newReciep = generateFields(recipientResp,docIdList);
                                console.log(newReciep);
                                var actionMap = {};
                                actionMap.actions=newReciep;
                                var requestId = recipientResp.request_id;
                                var updateRecipientsData = {
                                    "reqId": requestId,
                                }
                                var requestsJson = {};
                                requestsJson.requests = actionMap;
                                //requestsJson.requests.request_name = "Note";
                                console.log("before encode :: ");
                                console.log(requestsJson);
                                updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));
                                console.log("After encode :: ");
                                console.log(updateRecipientsData);
                                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.sendsignrequest, updateRecipientsData)
                                .then(function(data) {
                                    console.log("sendsignrequest ::: ");
                                    console.log(data);
                                    debugger;
                                    if(data.status_code < 300){
                                       // alert("uploadFile sendsignrequest is done!");
                                       $("#Loading").text("uploadFile sendsignrequest is done!");
                                    }
                                    else{
                                       // alert("error in uploadFile sendsignrequest!! ");
                                       //$("#Loading").text("error in uploadFile sendsignrequest!");
                                       r = data.response;
                                        code = JSON.parse(r).code;
                                        if(code == 9101){
                                            $("#Loading").text("Error in sendsignrequest! Kindly add atleast one field for a signer.");
                                        }else{
                                            $("#Loading").text("Error in sendsignrequest!");
                                        }
                                    }
                                    
                                });
                                populateZohoSignDocuments(response, file);
                            } else {
                                alert("Error in updateRecipients");
                                toggleGIF();
                            }
                        })

                } else {
                    alert("Error in Uploading File");
                    toggleGIF();
                }
            });
    } 
    else 
    {
        alert("Fill the form fully!");
        toggleGIF();
    }
}

function populateZohoSignDocumentsEvents(response, recordId, file) {
    zsignDocumentEvent = configData.signRelatedModulesAPIName.ZSignDocumentEvents;//JSON.parse(configData.signRelatedModulesAPIName).ZSignDocumentEvents;
    zohoSignDocumentsEvents = getMetaData(zsignDocumentEvent+"1");//getMetaData("ZohoSign_Document_Events1");
    configData.zsignDocuEventFields[0].Name;
    var arrData = []; 
    var params = {};
    params[configData.zsDocuEventFields.Name] = response.requests.document_ids[0].document_name + "-" + "SIGNATURE_REQUESTED";
    params[configData.zsDocuEventFields.Description] = "Sent out for Signature";
    params[configData.zsDocuEventFields.ZohoSign_Documents] = recordId;
    /*
    params.Name = response.requests.document_ids[0].document_name + "-" + "SIGNATURE_REQUESTED";
    params.Description = "Sent out for Signature";
    params.ZohoSign_Documents = recordId;
    */
    var date = new Date();
    //var formattedDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    var formattedDate = date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    params.Date = formattedDate;

    arrData.push(params);
    var params1 = {};    
    params1[configData.zsDocuEventFields.Name] = response.requests.document_ids[0].document_name + "-" + "SIGNATURE_INPROGRESS";
    params1[configData.zsDocuEventFields.Description] = "Sent out for Signature and inprogess stage";
    params1[configData.zsDocuEventFields.ZohoSign_Documents] = recordId;
    params1.Date = formattedDate;
    arrData.push(params1);

    ZOHO.CRM.API.insertRecord({
        Entity: zohoSignDocumentsEvents.api_name,
        APIData: arrData
    }).then(function(data) {
        var code = data.data[0].code;
        if (code.includes("SUCCESS")) {
            var editUrl = response.requests.request_edit_url;  
            console.log(editUrl);          
            
            //window.open(editUrl, '_blank');
            //alert("Document for Sign has been Sent Successfully!");
            //ZOHO.CRM.UI.Popup.close();
            ZOHO.CRM.UI.Popup.closeReload()
            .then(function(data){
                console.log(data)
            })

        } else {
            alert("Error in writing in ZohoSign Document Events");
            toggleGIF();
        }
    });
}

function populateZohoSignRecipients(response, recordId, file) {
    var params = [];
    zsignRecipient = configData.signRelatedModulesAPIName.ZSignRecipients;//JSON.parse(configData.signRelatedModulesAPIName).ZSignRecipients;
    zohoSignRecipients = getMetaData(zsignRecipient+"1");//getMetaData("ZohoSign_Recipients1");
    var keys = Object.keys(recipients);
    for (var _i = 0; _i < keys.length; _i++) {
        var currentKey = keys[_i];
        var tempObj = {};
        tempObj[configData.zsRecipFields.Name] = recipients[currentKey].split("-")[0];
        tempObj[configData.zsRecipFields.Email] = recipients[currentKey].split("-")[1];
        tempObj[configData.zsRecipFields.Recipient_Type] = recipients[currentKey].split("-")[3] == "SIGN" ? "SIGNER" : "CC";
        tempObj[configData.zsRecipFields.ZohoSign_Document_ID] = response.requests.document_ids[0].document_id;
        tempObj[configData.zsRecipFields.ZohoSign_Document] = recordId;
        tempObj[configData.zsRecipFields.Recipient_Status] = "UNOPENED";
        params[_i] = tempObj;
    }
    ZOHO.CRM.API.insertRecord({
        Entity: zohoSignRecipients.api_name,
        APIData: params
    });
    populateZohoSignDocumentsEvents(response, recordId, file);
}

function populateZohoSignDocuments(response, file) {
    var recordId;
    zSignDocument = configData.signRelatedModulesAPIName.ZSignDocuments;//JSON.parse(configData.signRelatedModulesAPIName).ZSignDocuments;
    zohoSignDocument = getMetaData(zSignDocument+"1");//getMetaData("ZohoSign_Documents1");
    var date = new Date();
    //var formattedDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    //MyDateString = ('0' + MyDate.getDate()).slice(-2) + '/' + ('0' + (MyDate.getMonth()+1)).slice(-2) + '/' + MyDate.getFullYear();
    var formattedDate = date.getFullYear() + '-' + ('0' + (date.getMonth()+1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    /*var params = {
        "ZohoSign_Document_ID": response.requests.document_ids[0].document_id,
        "Date_Sent": formattedDate,
        "Name": response.requests.document_ids[0].document_name
    }*/
    var params = {};
    params[configData.zsDocuFields.ZohoSign_Document_ID] = response.requests.document_ids[0].document_id;
    params[configData.zsDocuFields.Date_Sent] = formattedDate;
    //params[configData.zsDocuFields.Name] = response.requests.document_ids[0].document_name;
    params[configData.zsDocuFields.Name] = response.requests.request_name;
    params[configData.zsDocuFields.Document_Status] = "INPROGRESS";
    params["Sign_Request_ID"] = response.requests.request_id+"";
    params["Is_Sign_Reminder_Sent"] = false;
    params["Number_of_Sign_Reminder_Sent"] = "0";
    
    var singularModuleName = data.pageLoadData.Entity.substr(0, data.pageLoadData.Entity.length - 1);
    params[singularModuleName] = String(data.pageLoadData.EntityId[0]);
    
    if(data.pageLoadData.Entity.includes("Deals")){
        params["Deals"] = String(data.pageLoadData.EntityId[0]);
        if(lookupRecData.Horse != undefined){
            params["Horse"]= lookupRecData.Horse.id;    
        }        
        params["Contacts"] = lookupRecData.Contact_Name.id;
    }else if(data.pageLoadData.Entity.includes("Contract_Changes")){
        params["Contract_Changes"] = String(data.pageLoadData.EntityId[0]);
        params["Contacts"] = lookupRecData.Contact_Name.id;
    }else{
        params["Contacts"] = lookupRecData.id;
    }
    ZOHO.CRM.API.insertRecord({
        Entity: zohoSignDocument.api_name,
        APIData: params
    }).then(function(data) {
        var resp = data.data[0].code;
        if (resp.includes("SUCCESS")) {
            recordId = data.data[0].details.id;
            var tempFile = $.find('input[type=file]')[0].files[0];
            if(tempFile == undefined)
            {
                tempFile = fileStream;
            }

            if(tempFile == undefined)
            {
                populateZohoSignRecipients(response, recordId, file);
                //window.setTimeout(populateZohoSignDocuments, 2000);
                return;
            }
            // Testing this !!

            readFileAsArrayBuffer(tempFile, function(data) {
                //var array = new Int8Array(data);
                //output.value = JSON.stringify(array, null, '  ');
                console.log("Main Place!");
                console.log(data);
                console.log(file.name);
                //var temp = data.result;
                //console.log(temp);
                 blob = new Blob([new Uint8Array(data)]);
                 ZOHO.CRM.API.attachFile({
                     Entity: zohoSignDocument.api_name,
                     RecordID: recordId,
                     File: {
                         Name: file.name,
                         Content: blob
                     }
                 }).then(function(result){
                    console.log("Harry!");
                    console.log(result);
                    });
                populateZohoSignRecipients(response, recordId, file);

                // window.setTimeout(populateZohoSignDocuments, 2000);
                }, function (e) {
                console.error(e);
                });


           /* var reader = new FileReader();
            reader.onload = function(){
                var arrayBuffer = reader.result;
                console.log(arrayBuffer.byteLength);
                };
            //var thefiledata = reader.readAsArrayBuffer(tempFile);
            var thefiledata = reader.readAsBinaryString(tempFile); 
            var blob;
             reader.onloadend = function(e) {
                 var temp = e.result;
                 blob = new Blob([new Uint8Array(temp)]);
                 ZOHO.CRM.API.attachFile({
                     Entity: zohoSignDocument.api_name,
                     RecordID: recordId,
                     File: {
                         Name: file.name,
                         Content: blob
                     }
                 });
                populateZohoSignRecipients(response, recordId, file);
             } */
        } else {
            alert("Error in writing in ZohoSignDocuments");
            toggleGIF();
        }
    });
}

function readFileAsArrayBuffer(file, success, error) {
    console.log("Hey Inside readFileAsArrayBuffer seperate method!");

    var fr = new FileReader();
    fr.addEventListener('error', error, false);
    if (fr.readAsBinaryString) {
        console.log("readAsBinaryString is working!");
        fr.addEventListener('load', function () {
            console.log("inside load! ");
            var string = this.resultString != null ? this.resultString : this.result;
            var result = new Uint8Array(string.length);
            for (var i = 0; i < string.length; i++) {
                result[i] = string.charCodeAt(i);
            }
            success(result.buffer);
        }, false);
        console.log("going to return!! ");
        return fr.readAsBinaryString(file);
    } else {
        console.log("AsArrayBuffer is working!");
        fr.addEventListener('load', function () {
            success(this.result);
        }, false);
        return fr.readAsArrayBuffer(file);
    }
}

function getInventoryTemplates(){
    //{"templates":[],"info":{"per_page":200,"count":0,"page":1,"more_records":false}}
    params = {"module":data.pageLoadData.Entity};
    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getMMTemplates,params).then(function(data){
        
        console.log(data);
        code = data.code;
            if("success" == code)
            {
                var templateData = {};
                output = data.details.output;
                console.log(output);
                var resp = JSON.parse(output);
                jsonResp = JSON.parse(resp.response)
                //jsonResp={"templates":[{"module":"Deals","last_used":null,"description":null,"type":"writer","created_by":{"name":"Matt Moffett","id":"3839889000000201013"},"folder":{"id":"3839889000000388003"},"modified_time":"2019-08-08T03:35:20-07:00","name":"JM Leadership Workshop Agreement.docx","modified_by":{"name":"Matt Moffett","id":"3839889000000201013"},"resource_id":"0988d42e032c333c84a6183c46b574642669f","id":"3839889000000410128","module_name":"Deals","favorite":false},{"module":"Deals","last_used":null,"description":null,"type":"writer","created_by":{"name":"Matt Moffett","id":"3839889000000201013"},"folder":{"id":"3839889000000388003"},"modified_time":"2019-07-31T11:02:23-07:00","name":"JMT Standard Coaching Agreement.doc","modified_by":{"name":"Matt Moffett","id":"3839889000000201013"},"resource_id":"10ndk710b1e6d27ce435fbe69e56ec312fb6d","id":"3839889000000397141","module_name":"Deals","favorite":false}],"info":{"per_page":200,"count":2,"page":1,"more_records":false}};
                templatesSize = jsonResp.inventory_templates.length;
                if(templatesSize > 0)
                {
                    var tempList = [];//jsonResp.templates;
                    var jsonObj = {};
                    for(i=0;i<templatesSize;i++)
                    {
                        tempList.push({"Id":jsonResp.inventory_templates[i].id,"Name":jsonResp.inventory_templates[i].name});
                        //tempList[i]["Id"] = jsonResp.templates[i].id;
                        //tempList[i]["Name"] = jsonResp.templates[i].name;
                    }
                    templateData = {
                        files  : tempList
                    }                    
                }
                $(".bg").show();
                Utils.RenderTemplate("mmTemplateListing",templateData, "fileFromMailMerge",showSelectBOx);
            }
    },function(err){
            var templateData = {};
            $(".bg").show();
            Utils.RenderTemplate("mmTemplateListing",templateData, "fileFromMailMerge",showSelectBOx);
            $(".file-box").text("You need API and Workflow Permissions to fetch Mail Merge templates, Please contact your administrator");
    });
 
}
function getMailMergeTemplates(){
    //{"templates":[],"info":{"per_page":200,"count":0,"page":1,"more_records":false}}
    params = {"module":data.pageLoadData.Entity};
    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getMMTemplates,params).then(function(data){
        
        console.log(data);
        code = data.code;
            if("success" == code)
            {
                var templateData = {};
                output = data.details.output;
                console.log(output);
                var jsonResp = JSON.parse(output);
                //jsonResp={"templates":[{"module":"Deals","last_used":null,"description":null,"type":"writer","created_by":{"name":"Matt Moffett","id":"3839889000000201013"},"folder":{"id":"3839889000000388003"},"modified_time":"2019-08-08T03:35:20-07:00","name":"JM Leadership Workshop Agreement.docx","modified_by":{"name":"Matt Moffett","id":"3839889000000201013"},"resource_id":"0988d42e032c333c84a6183c46b574642669f","id":"3839889000000410128","module_name":"Deals","favorite":false},{"module":"Deals","last_used":null,"description":null,"type":"writer","created_by":{"name":"Matt Moffett","id":"3839889000000201013"},"folder":{"id":"3839889000000388003"},"modified_time":"2019-07-31T11:02:23-07:00","name":"JMT Standard Coaching Agreement.doc","modified_by":{"name":"Matt Moffett","id":"3839889000000201013"},"resource_id":"10ndk710b1e6d27ce435fbe69e56ec312fb6d","id":"3839889000000397141","module_name":"Deals","favorite":false}],"info":{"per_page":200,"count":2,"page":1,"more_records":false}};
                templatesSize = jsonResp.templates.length;
                if(templatesSize > 0)
                {
                    var tempList = [];//jsonResp.templates;
                    var jsonObj = {};
                    for(i=0;i<templatesSize;i++)
                    {
                        tempList.push({"Id":jsonResp.templates[i].id,"Name":jsonResp.templates[i].name});
                        //tempList[i]["Id"] = jsonResp.templates[i].id;
                        //tempList[i]["Name"] = jsonResp.templates[i].name;
                    }
                    templateData = {
                        files  : tempList
                    }                    
                }
                $(".bg").show();
                Utils.RenderTemplate("mmTemplateListing",templateData, "fileFromMailMerge",showSelectBOx);
            }
    },function(err){
            var templateData = {};
            $(".bg").show();
            Utils.RenderTemplate("mmTemplateListing",templateData, "fileFromMailMerge",showSelectBOx);
            $(".file-box").text("You need API and Workflow Permissions to fetch Mail Merge templates, Please contact your administrator");
    });
 
}

function addMMTemplate(){
    console.log("addMMTemplate");
    templateId = $("#templates").find(":selected").val();
    if("-None-" == templateId)
    {
        alert("Please select a template to create document.");
        return;
    }

    $("#addTemplate").text("Creating");
    $("#addTemplate").css({
        "cursor": "wait",
        "pointer-events": "none"
    });

    fileName = $("#templates").find(":selected").text();
    $(".appText").html(fileName); 
    $("#docuName").val(fileName);

cancelPopup();
    $('input[type="file"]').attr('title', window.webkitURL ? ' ' : '');

    /*
    params = {"module":"Contacts","templateId":templateId};
    module = data.pageLoadData.Entity;
    recordId = data.pageLoadData.EntityId[0];
    ZOHO.CRM.FUNCTIONS.execute("getMergeFile",params).then(function(data){

         
        console.log(data);
        code = data.code;
            if("success" == code)
            {
                var templateData = {};
                output = data.details.output;
                console.log(output);
                fileStream = output;
                fileStream.name = $("#templates").find(":selected").text();
            }
    });
    */
}
function setFileFromDocs(){
    console.log("ITS setFileFromDocs!");
    var testReq = {
               //url : "http://eapp.docs.localzohoplatform.com/api/v2/files",
               url : "http://e360crm.docs.zohoplatform.com/api/v2/files",
               params:{
                    action:"crmworkspaces",
                    zsoid:zsoid,
                    folderid:-1,
                    start:0,
                    end:50,
                    scope:"crmapi",
                    type:"AllUsers"
               },
               headers:{
                    Authorization:DocsAuthToken,
               } 
        };   
        ZOHO.CRM.HTTP.get(testReq).then(function(data){
            console.log(data);
            var resultJson = JSON.parse(data);
            var templateData = {};
            recordCount = resultJson.total_resources[0].no_of_res;
            if(recordCount <= 0)
            {
                alert("No records found in Document Space!");
            }else{
                var dataList = [];
                var recordLength = resultJson.dataobj.length;
                for(i=0; i<recordLength; i++)
                {
                    var fileData = resultJson.dataobj[i];
                    if(fileData.hasOwnProperty("split_value"))
                    {
                        continue;
                    }
                    dataList.push(fileData);                    
                }
                 templateData = {
                        files  : dataList
                    }
            }
            $(".bg").show();
            Utils.RenderTemplate("fileListing",templateData,"fileUploadFromDocs",Utils.hideLoading);
        })
}
function setFileName() {
    console.log("This is setFileName!");
    var fileName = document.getElementById("file").files[0].name;
    $(".appText").html(fileName);
    $("#docuName").val(fileName); 
  /*  var testReq ={
    url : "https://nuclearcrmus.docs.zohoplatform.com/api/v2/files",
    params:{
            action:"crmworkspaces",
            zsoid:10010350277,
            folderid:-1,
            start:0,
            end:50,
            integViewType:"recentdocs",
            scope:"crmapi",
            type:"AllUsers"
        },
    headers:{
            Authorization:"10008798811.10010351376.31825ff36928f3b0669212a84d887bbc68afff0cab7567cd8d77e816c72804b01bd5d5fa20fa5954d72af33276cc8ae10bdd0f2c00c990f7fde7abb2d7d441ee",
        }
    }
    ZOHO.CRM.HTTP.get(testReq)
    .then(function(data){
            console.log(data)
        })
*/
}

function fetchRecords(searchField){
    //if("none"==$("#SignerDiv"+rowCounter).css("display")){
        var rowNumber = searchField.id.split("_")[1];
        //populateUserUI(userArray,rowNumber);
        //copySecondaryRecordsData = userArray;
        copySecondaryRecordsData = [];
        var text = $("#searchField_" + rowNumber).val();
        if (text.length > 2) {
            for(i=0;i<userArray.length;i++){
                user_email = userArray[i].email;
                user_Fullname = userArray[i].full_name;
                if( user_email.toUpperCase().includes(text.toUpperCase()) || user_Fullname.toUpperCase().includes( text.toUpperCase() ) ) {
                    copySecondaryRecordsData.push(userArray[i]);
                }
            }
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                populateUserSelect(rowNumber);
            }, 500);
        }
    //}
    /*else{
        var rowNumber = searchField.id.split("_")[1];
        //populateUserUI(userArray,rowNumber);
        copySecondaryRecordsData = zsignUserArray;
        var text = $("#searchField_zsuser" + rowNumber).val();
        if (text.length > 2) {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                populate_zsUserSelect(rowNumber);
            }, 500);
        }
    }*/        
}
function fetchRecordsOld(searchField) {
    
    var rowNumber = searchField.id.split("_")[1];
    var text = $("#searchField_" + rowNumber).val();
    if (text.length > 3) {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            Promise.all([ZOHO.CRM.API.searchRecord({
                Entity: "Contacts",
                Type: "word",
                Query: text
            }), ZOHO.CRM.API.searchRecord({
                Entity: "Leads",
                Type: "word",
                Query: text
            })]).then(function(response) {
                populateUI(response, rowNumber);
            });

        }, 500); // Change this to delay the requests
    }
}
function generateFields(recipientResp, docIdList){
    var newReciep = [];
    var documentId = docIdList[0].document_id;
    var len = recipientResp.actions.length;
    /*
    var signXaxis = 99;
    var signYaxis = 3;

    var emailXaxis = 4;
    var emailYaxis = 3;
    var tempJson1 = {};
    tempJson1.fields=[{"abs_height":40,"abs_width":65,"action_id":"27074000000274056","description_tooltip":"","document_id":"27074000000277019","field_category":"image","field_label":"Signature","field_name":"Signature","field_type_id":"27074000000000141","is_mandatory":true,"page_no":0,"x_coord":99,"y_coord":3},{"abs_height":40,"abs_width":65,"action_id":"27074000000274056","default_value":"","description_tooltip":"","document_id":"27074000000277019","field_category":"textfield","field_label":"Email","field_name":"Email","field_type_id":"27074000000000149","is_mandatory":true,"page_no":0,"text_property":{"font":"Arial","font_color":"000000","font_size":11,"is_bold":false,"is_italic":false,"is_read_only":false,"is_underline":false},"x_coord":4,"y_coord":3}];
    */
    for(var _i=0; _i<len;_i++){
        var tempJson = {};
        //tempJson = tempJson1;
        var actionVar = {};
        actionId = recipientResp.actions[_i].action_id;
        actionVar.action_id = actionId;
        actionVar.action_type = recipientResp.actions[_i].action_type;
        actionVar.deleted_fields=[];
        actionVar.private_notes="";
        actionVar.signing_order = recipientResp.actions[_i].signing_order;
        actionVar.verify_recipient = recipientResp.actions[_i].verify_recipient;
        /*
        tempJson.fields[0].y_coord=signYaxis;
        tempJson.fields[1].y_coord=emailYaxis;
        signYaxis = signYaxis + 60;
        emailYaxis = emailYaxis + 60;

        for(var j=0;j<tempJson.fields.length;j++){
            tempJson.fields[j].action_id = actionId;
            tempJson.fields[j].document_id = documentId;

        }
        */
        //actionVar.fields=tempJson.fields;
        newReciep.push(actionVar);
    }
    
    return newReciep;
    //tempJson.fields = {"image_fields":[{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","description_tooltip":"","document_id":"27074000000277019","field_category":"image","field_label":"Signature","field_name":"Signature","field_type_id":"27074000000000141","is_mandatory":true,"page_no":0,"x_coord":42,"y_coord":3}],"radio_groups":{},"text_fields":[{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","default_value":"","description_tooltip":"","document_id":"27074000000277019","field_category":"textfield","field_label":"Email","field_name":"Email","field_type_id":"27074000000000149","is_mandatory":true,"page_no":0,"text_property":{"font":"Arial","font_color":"000000","font_size":11,"is_bold":false,"is_italic":false,"is_read_only":false,"is_underline":false},"x_coord":4,"y_coord":3}]};
    //{"fields":[{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","description_tooltip":"","document_id":"27074000000277019","field_category":"image","field_label":"Signature","field_name":"Signature","field_type_id":"27074000000000141","is_mandatory":true,"page_no":0,"x_coord":42,"y_coord":3},{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","default_value":"","description_tooltip":"","document_id":"27074000000277019","field_category":"textfield","field_label":"Email","field_name":"Email","field_type_id":"27074000000000149","is_mandatory":true,"page_no":0,"text_property":{"font":"Arial","font_color":"000000","font_size":11,"is_bold":false,"is_italic":false,"is_read_only":false,"is_underline":false},"x_coord":4,"y_coord":3}]}
}
function generateActions(updateDataGenerator, signOrderSet) {
    debugger;
    var actions = [];
    var secondaryRecords = $.find("[id*='tr_row_']");
    for (var _i = 0; _i < secondaryRecords.length; _i++) {
        var currentDivRowId = secondaryRecords[_i].id.split("_")[3];
        var rowNumber = secondaryRecords[_i].id.split("_")[2];
        displayVal = $("#emailRecip_"+rowNumber).css("display");
        var tempJson = {};
        /*
        tempJson.subject="$SENDER_NAME$ from $ORG_NAME$ requests you to sign $DOCUMENT_NAME$ !!";
        tempJson.mail_template="<div class=\"container\" style=\"width: 100% !important; line-height: 1.6em; font-size: 14px; background-color: rgb(246, 246, 246); padding-top: 20px\"><table style=\"background-color: rgb(246, 246, 246); width: 600px; margin: 0 auto !important\"><tbody><tr><td><br></td><td style=\"display: block !important; width: 600px !important; margin: 0 auto !important; clear: both !important\" class=\"templateColumns\"><div style=\"margin: 0 auto; display: block\"><table style=\"background-color: rgb(255, 255, 255)\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td style=\"font-size: 16px; font-weight: 500; padding: 20px; line-height: 18px; background-color: rgb(255, 255, 255)\"><img src=\"$LOGO_URL$\" id=\"ztb-logo-rebrand\" style=\"max-height: 50px\"><br></td></tr><tr><td><table width=\"100%\" align=\"center\" cellpadding=\"10\" cellspacing=\"0\" style=\"background-color: rgb(81, 210, 182)\"><tbody><tr><td style=\"color: rgb(255, 255, 255); font-size: 16px; font-family: Helvetica, Arial, Sans Serif; border: none; background-color: rgb(81, 210, 182); padding: 20px; height: 28px\" class=\"header-row\"><div style=\"text-align: left; float: left; line-height: normal; padding: 0px 0 0 10px; display: inline-block; font-size: 24px; width: 100%\" class=\"sign-mail-header\">Digital Signature Request<br></div></td></tr></tbody></table></td></tr><tr><td style=\"padding: 25px 40px 0px 40px\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding-bottom: 20px\"><tbody style=\"font-size: 14px; color: rgb(68, 68, 68); line-height: 20px\"><tr><td style=\"padding: 0 0 20px; font-size: 14px\" class=\"message-row\"><div class=\"sign-mail-message\" style=\"word-wrap: break-word; width: 100%; float: left\"><span>$SENDER_NAME$ has requested you to review and sign $DOCUMENT_NAME$</span><br></div></td></tr><tr><td><table style=\"width: 100%; table-layout: fixed\"><tbody><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Sender<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$SENDER_EMAIL$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Organization Name<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$ORG_NAME$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Expires on<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$EXPIRY_DATE$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px; vertical-align: top\"><td width=\"35%\" style=\"font-weight: 600\">Message to all<br></td><td>$NOTE$<br></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"padding: 0 0 20px\"><table width=\"100%\"><tbody><tr><td align=\"center\" style=\"padding-top: 15px\"><div><table><tbody><tr><td align=\"center\" style=\"font-size: 15px; color: rgb(255, 255, 255); background-color: rgb(232, 78, 88); text-align: center; text-decoration: none; border-radius: 2px; display: inline-block; min-height: 38px\" class=\"button-row\"><a class=\"sign-mail-btn-link\" href=\"$LINK_TO_SIGN$\" style=\"font-size: 18px; color: rgb(255, 255, 255); text-align: center; text-decoration: none; border-radius: 3px; display: inline-block; padding: 0px 30px; float: left\" rel=\"noopener noreferrer\" target=\"_blank\"><div style=\"line-height: 38px; font-size: 18px\" class=\"sign-mail-btn-text\">Start Signing<br></div></a></td></tr></tbody></table></div></td></tr></tbody></table></td></tr></tbody></table></div></td><td><br></td></tr></tbody></table><div class=\"disclaimer-container\" style=\"background-color: #f6f6f6;width: 600px;padding: 10px 0px 20px 0px;margin: 0 auto;\">$FOOTER_CONTENT$</div></div><div><br></div><style type=\"text/css\">@media only screen and (max-width: 480px) {.templateColumns { width: 100% !important } }<br></style>";
        
        tempJson.subject="$SENDER_NAME$ from $ORG_NAME$ requests your signature";
        tempJson.mail_template="<div class=\"container\" style=\"width: 100% !important; line-height: 1.6em; font-size: 14px; background-color: rgb(246, 246, 246); padding-top: 20px\"><table style=\"background-color: rgb(246, 246, 246); width: 600px; margin: 0 auto !important\"><tbody><tr><td><br></td><td style=\"display: block !important; width: 600px !important; margin: 0 auto !important; clear: both !important\" class=\"templateColumns\"><div style=\"margin: 0 auto; display: block\"><table style=\"background-color: rgb(255, 255, 255)\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td style=\"font-size: 16px; font-weight: 500; padding: 20px; line-height: 18px; background-color: rgb(255, 255, 255)\"><img src=\"$LOGO_URL$\" id=\"ztb-logo-rebrand\" style=\"max-height: 50px\"><br></td></tr><tr><td><table width=\"100%\" align=\"center\" cellpadding=\"10\" cellspacing=\"0\" style=\"background-color: rgb(81, 210, 182)\"><tbody><tr><td style=\"color: rgb(255, 255, 255); font-size: 16px; font-family: Helvetica, Arial, Sans Serif; border: none; background-color: rgb(81, 210, 182); padding: 20px; height: 28px\" class=\"header-row\"><div style=\"text-align: left; float: left; line-height: normal; padding: 0px 0 0 10px; display: inline-block; font-size: 24px; width: 100%\" class=\"sign-mail-header\">Digital Signature Request<br></div></td></tr></tbody></table></td></tr><tr><td style=\"padding: 25px 40px 0px 40px\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding-bottom: 20px\"><tbody style=\"font-size: 14px; color: rgb(68, 68, 68); line-height: 20px\"><tr><td style=\"padding: 0 0 20px; font-size: 14px\" class=\"message-row\"><div class=\"sign-mail-message\" style=\"word-wrap: break-word; width: 100%; float: left\"><span>$SENDER_NAME$ from $ORG_NAME$ has requested you to review and sign $DOCUMENT_NAME$ this document</span><br></div></td></tr><tr><td><table style=\"width: 100%; table-layout: fixed\"><tbody><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Sender<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$SENDER_EMAIL$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Organization Name<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$ORG_NAME$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Expires on<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$EXPIRY_DATE$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px; vertical-align: top\"><td width=\"35%\" style=\"font-weight: 600\">Message to all<br></td><td>$NOTE$<br></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"padding: 0 0 20px\"><table width=\"100%\"><tbody><tr><td align=\"center\" style=\"padding-top: 15px\"><div><table><tbody><tr><td align=\"center\" style=\"font-size: 15px; color: rgb(255, 255, 255); background-color: rgb(232, 78, 88); text-align: center; text-decoration: none; border-radius: 2px; display: inline-block; min-height: 38px\" class=\"button-row\"><a class=\"sign-mail-btn-link\" href=\"$LINK_TO_SIGN$\" style=\"font-size: 18px; color: rgb(255, 255, 255); text-align: center; text-decoration: none; border-radius: 3px; display: inline-block; padding: 0px 30px; float: left\" rel=\"noopener noreferrer\" target=\"_blank\"><div style=\"line-height: 38px; font-size: 18px\" class=\"sign-mail-btn-text\">Start Signing<br></div></a></td></tr></tbody></table></div></td></tr></tbody></table></td></tr></tbody></table></div></td><td><br></td></tr></tbody></table><div class=\"disclaimer-container\" style=\"background-color: #f6f6f6;width: 600px;padding: 10px 0px 20px 0px;margin: 0 auto;\">$FOOTER_CONTENT$</div></div><div><br></div><style type=\"text/css\">@media only screen and (max-width: 480px) {.templateColumns { width: 100% !important } }<br></style>";
        */

        var displayTextName;
        var displayTextEmail;
        var chosenValue;
        debugger;
        if(displayVal != "none"){
            displayTextEmail = $("#recipientMail_"+rowNumber).val();
            displayTextName = $("#recipientName_"+rowNumber).val();

            if(displayTextEmail == ""){
                alert("invalid emailId");
                toggleGIF();
            }
            if(displayTextName == ""){
                displayTextName = displayTextEmail.split("@")[0];
            }
            displayTextName = displayTextName.replaceAll("\"","");
            displayTextName = displayTextName.replaceAll("\'","");
            tempJson.recipient_name = displayTextName;
            tempJson.recipient_email = displayTextEmail.includes("@") ? displayTextEmail : "";
            var secondarySignerRole = $("#signerRole_row_" + rowNumber + "_" + currentDivRowId);
            chosenValue = secondarySignerRole[0].options[secondarySignerRole[0].selectedIndex].value.toUpperCase();
            tempJson.action_type = chosenValue;
        }else{
            var test1 = $("#select_row_" + rowNumber + "_" + currentDivRowId).chosen().val().split("}")[0];
            displayTextName = test1.replace("{", "");
            var test2 = $("#select_row_" + rowNumber + "_" + currentDivRowId).chosen().val().split("}")[1];
            displayTextEmail = test2.trim();
            //"fields":{"image_fields":[{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","description_tooltip":"","document_id":"27074000000277019","field_category":"image","field_label":"Signature","field_name":"Signature","field_type_id":"27074000000000141","is_mandatory":true,"page_no":0,"x_coord":42,"y_coord":3}],"radio_groups":{},"text_fields":[{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","default_value":"","description_tooltip":"","document_id":"27074000000277019","field_category":"textfield","field_label":"Email","field_name":"Email","field_type_id":"27074000000000149","is_mandatory":true,"page_no":0,"text_property":{"font":"Arial","font_color":"000000","font_size":11,"is_bold":false,"is_italic":false,"is_read_only":false,"is_underline":false},"x_coord":4,"y_coord":3}]}
           // tempJson.fields = {"image_fields":[{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","description_tooltip":"","document_id":"27074000000277019","field_category":"image","field_label":"Signature","field_name":"Signature","field_type_id":"27074000000000141","is_mandatory":true,"page_no":0,"x_coord":42,"y_coord":3}],"radio_groups":{},"text_fields":[{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","default_value":"","description_tooltip":"","document_id":"27074000000277019","field_category":"textfield","field_label":"Email","field_name":"Email","field_type_id":"27074000000000149","is_mandatory":true,"page_no":0,"text_property":{"font":"Arial","font_color":"000000","font_size":11,"is_bold":false,"is_italic":false,"is_read_only":false,"is_underline":false},"x_coord":4,"y_coord":3}]};
            displayTextName = displayTextName.replaceAll("\"","");
            displayTextName = displayTextName.replaceAll("\'","");
            tempJson.recipient_name = displayTextName;
            tempJson.recipient_email = displayTextEmail.includes("@") ? displayTextEmail : "";
            var secondarySignerRole = $("#signerRole_row_" + rowNumber + "_" + currentDivRowId);
            chosenValue = secondarySignerRole[0].options[secondarySignerRole[0].selectedIndex].value.toUpperCase();
            tempJson.action_type = chosenValue;
        }
        
        //debugger;
        if(chosenValue == "INPERSONSIGN"){
            //tempJson.in_person_name= "apitest";
            //tempJson.in_person_email="hariharasudhanzoho@gmail.com"
            tempJson.in_person_email = displayTextEmail.includes("@") ? displayTextEmail : "";
            tempJson.in_person_name = displayTextName;
            //tempJson.recipient_name = $("#hostName"+rowNumber).val();
            //tempJson.recipient_email = $("#hostEmail"+rowNumber).val();
            zsignUser = $("#select_zsuser_row_"+rowNumber).find(":selected").text();
            tempJson.recipient_name = zsignUser.split("-")[1];
            tempJson.recipient_email = zsignUser.split("-")[0];
        }
        /*else{
            tempJson.recipient_name = displayTextName;
            tempJson.recipient_email = displayTextEmail.includes("@") ? displayTextEmail : "";
        
        }*/
        if (signOrderSet) {
            var orderStr = $("#signOrder_row_" + rowNumber + "_" + currentDivRowId).val();
            if(isNormalInteger(orderStr)){
                tempJson.signing_order = orderStr;
            }else{
                tempJson.signing_order = "1";
            }
            
        }
        actions[_i] = tempJson;
        recipients[currentDivRowId] = displayTextName + "-" + displayTextEmail + "-" + $("#signOrder_row_" + rowNumber + "_" + currentDivRowId).val() + "-" + chosenValue;
    }
    updateDataGenerator.actions = actions;
}

// document.onreadystatechange = function() {
//     console.log("\n onreadystatechange!!");
//     initZohoSign();
// }
Utils.RenderTemplate=function(templateId , data, divId,callBack){
    
    var template = $("#"+templateId).html();
    if(template ==  undefined) {
        
         $("."+divId+", .bg").show();
    }else{
        var compiledTemplate = Handlebars.compile(template);
        var widgetsDiv = $("."+divId);
        widgetsDiv.html(compiledTemplate(data));
        if(callBack)
            {
                callBack();
               // $('#open-folderinBox').show();
                $("."+divId).show();
            }
    }
    
};
Utils.hideLoading = function(){
    $("#loadingDiv").hide();
}
Utils.moveToolTip = function(obj){
    
    var thumbNailImg = $($(obj).find("img")[0])
    $(thumbNailImg).css({top:mousePos.getY()+15,left:mousePos.getX()+15});
    
}
function isNormalInteger(str) {
    var n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n > 0;
}
function chooseFile(downloadURL,fileName,fileType)
{
    if(downloadURL != undefined && downloadURL != null)
    {
        rId = downloadURL.split("=")[1];
        console.log("Inside chooseFile( Select From Document )!");


    /*var testReq = {
               url : "http://eapp.docs.localzohoplatform.com/api/v2/files/download",
               params:{
                    resourceId:rId,                    
               },
               headers:{
                    Authorization:DocsAuthToken,
               } 
        };   
        ZOHO.CRM.HTTP.get(testReq).then(function(data){
            
            console.log(data);
            fileStream = data;
        }); */

    var testReq = {
               //url : "http://eapp.docs.localzohoplatform.com/api/v2/files/download",
               url : "http://e360crm.docs.zohoplatform.com/api/v2/files/download",
               params:{
                    resourceId:rId,                    
               },
               headers:{
                    Authorization:DocsAuthToken,
               },
                RESPONSE_TYPE:"stream"
        };   
        ZOHO.CRM.HTTP.get(testReq).then(function(data){
             console.log(data);
           // var a = document.createElement("a");
           // url = window.URL.createObjectURL(data); a.href = url; a.download = "naresh.docx"; a.click(); window.URL.revokeObjectURL(url);
            fileStream = data;
            fileStream.name = $(".appText").text();
        });

    //var fileName = document.getElementById("file").files[0].name;
    $(".appText").html(fileName); 
    $("#docuName").val(fileName);
    $(".fileUploadFromDocs, .bg").hide();
    //$(".bg").css("background","#fff");
    //$(".bg").css("z-index","0");


    }else
    {
        alert("Can't upload the file! Please Try again later!");
    }
    
}
function cancelPopup() {

    console.log("cancelPopup :: ");
    $(".bg").hide();
    $(".fileFromMailMerge").hide();
    $(".fileUploadFromDocs").hide();
    //$("."+_this).hide();
    //$("#file").text(" ");
    //$(".bg").hide();
}




/*
    <script id='fileListing' type='text/x-handlebars-template'>
    <div style="padding: 15px;">
        {{#unless files}}
        <div class="file-box">
            No Files Available
        </div>
        {{/unless}}
        {{#if files}}
            <table cellpadding="0" cellspacing="0" width="100%" class="fil-list">
                <tr>
                    <th colspan="3">Name</th>
                    <th>Size</th>
                    <th>Last Modified at</th>
                    <th>Last Modified by</th>
                </tr>
                {{#each files}}
                    <tr>
                        <td width="3%">
                            <div class="gDriveIcon">
                                <img src="{{this.iconLink}}"></img>
                            </div>
                        </td>
                        <td width="20%">
                            <a href="javascript:;" class="gDriveThumbNailHover" onmouseover="Utils.moveToolTip(this)" onmousemove="Utils.moveToolTip(this)">    
                                <span> {{this.title}} </span>
                                <img src="{{this.thumbnailLink}}"></img>
                            <a>
                        </td>
                        <td width="5%">
                            <a target="_blank" href="{{this.webContentLink}}"><div class="donwload-f"></div></a>
                        </td>
                        <td width="10%">{{this.fileSize}} bytes</td>
                        <td width="15%">{{this.modifiedDate}}</td>
                        <td width="25%">{{this.lastModifyingUser.displayName}}</td>
                    </tr>
                {{/each}}
            </table>
        {{/if}} 
        <div style="margin-top: 25px;">
            <input id="gdrive-file" type="file" class="fil-upl" onchange="Handler.uploadFile();" style="width: 100%;">
            <div class="file-box">
                <div style="clear:both;margin-bottom:30px;">
                    <p>Drop files to upload</p>
                </div>
                <a type="button" class="drop-btn" href="javascript:;" style="margin-top:20px;">or click here</a>
            </div>
        </div>
    </div>                                                                              
    </div>                                      
</script>
*/