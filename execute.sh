
#!/bin/bash

sfdx force:data:soql:query -o sandbox -q "
SELECT Id FROM Event__C WHERE (slug__c != null AND (slug__c = 'my_slug' OR slug__c = 'my_other_slug') AND (Name = 'my_name' OR Name != 'my_other_name')
LIMIT 5
"