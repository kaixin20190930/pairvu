# PIVOT-15 — implementation accepted, not deployed

November25,2026: Qwen4MaxPreview's official announced period ended at10:00UTC+8. Controller clock/sourcecheck02:14:45UTC (10:14:45Shanghai) was after thattime. This establishes elapsed publishedperiod, not actualendpointshutdown. [Source decision](source-decision.json) records ownerURL and verificationboundary; source retrievedthroughwebtool, no localrawcapture/hash retained. Independentreview accurately discloses thatlimit.

## Delivered locally

- Modelsummary,status,pricingnote andsharednotice consistently state officialpreviewperiodendedNov25 10:00UTC+8; actualAPIavailabilityunverified. ExistingQwen/GPTcomparison's samefact also corrected, no newpage.
- Source/pricecheck/contentdates forQwen reflect trueNov25verification, no24:00/Nov26futuredeadline. TokenPlanonly/noPAYG, replacementlinks andmetadata preserved. Allothermodelrecords/prices/numericalbenchmarks unchanged.
- Five boundedruntimefiles,58URLs/24profiles/22comparisons unchanged. Onlysixderivedaffectedlastmods advance. No sourcecrawler/framework/clientAPI/retirementtimer/newmodel/GSC/taskchanges.
- Localfixedcandidate `b0d94ad53e817dbf7d4c75b8d4c7555b825fe17e`. [Developer original](developer-original.json) fivegroupsPASS, fourSSRpages. Initialtemporaryprobecompileerror retained `/tmp/pivot15-dev/ssr-original.log`, correctedprobe's oneactual4pagerenderPASS; no runtimefailure.
- [Independent original](qa-original.json) fivegroupsPASS in one4pageSSR, exactcandidate, unchangedArgoncounterexample/metadata/data/inventory. [Handoff](qa-handoff.json) records raw `/tmp/pivot15-qa` evidence andsourcecapturelimit. NoextraSSR, listener/customer/account/externalassetcleanup needed.

## Release boundary / next action

Implementation and independentlocalacceptance complete. Production NOT deployed/enabled; no push, build, typecheck, APIavailabilitytest orproductionHTTPacceptance performed. Runtime unit stops at release-ready evidence because current user did not explicitly authorizeproduction; no previousreleaseapproval inherited. Registry is evidenceindex, historicalformallock/state unchanged.

Controller archives docs/evidence in localGitonly. Next requires explicit user authorization to push and deploy. After authorization, exactreleasecandidate must satisfy independentbinding/reused-evidence rules, fresh pushedremote/cleantree/sameSHA guardedbuild and at most7targetproductionGET acceptance, not assume localQA proves onlinecontent. Noautomaticrelease or development follows. OriginalGSC/retirement observation tasks unchanged; noAPIcalls should be added toinferavailability without separate scope.
