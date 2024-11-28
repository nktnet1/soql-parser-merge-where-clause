
#!/bin/bash

sfdx force:data:soql:query -o sandbox -q "
SELECT
  Id
FROM
  Event__C
WHERE
  (
    (
      slug__c != null
      AND Unit_Cap__c > 0
      AND Status__c = 'Active'
    )
    OR (
      Unit_Cap__c = 0
      AND Is_Published__c = true
    )
    OR (
      Created_Date__c > '2024-01-01'
      AND Owner.Name = 'Admin'
      AND (
        Tam = 5
        AND Kien = 6
      )
    )
  )
  AND (
    (
      Name LIKE '%test%'
      OR Description__c = 'special'
    )
    AND (
      Pricing__c > 100
      OR Pricing__c < 10
    )
    AND Is_Featured__c = true
    AND (
      Region__c IN ('US', 'EU')
      OR Country__c = 'Global'
    )
  )
"