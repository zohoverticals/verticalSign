# verticalSign

This version got minor changes in the widgetTrigger.js line no.299, 328 and line no. 1503 to 1506. 

Changes : Replaced the ()open/close parenthesis used in addRecipient() with curly braces{} functions to segragate the Recipient name from the Recipient email address. 

FIX : This will fix the issue with updateRecipientdata api "Error in Updaterecipient" occurs when hypen is used in the email address of the recipient. 


## Recent Update on 2/Nov/2021

This code file WidgetTrigger.js has code fixes for hyphen issue in all 3 cases. 
#. FirstRow Recipient(Deal/Contact record) Ln#299, 328 and  1503, 1505. 
##. Additional recipients(CRM-ZSignUsers) Ln#427, 426, and 1503, 1505. 
###. Host User(ZSignuser) for Inperson mode.(Ln # 1525,1526 and Ln# 551),
