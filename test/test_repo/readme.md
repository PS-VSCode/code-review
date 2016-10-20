## the testable repo
There are three branches:
* master
  - `readme.md`
  - `baseFile`
* branch1
  - `baseFile` : ammended from master's version
  - `newFile`
* branch2
  - `baseFile` : ammended from master's version

## Merge request results should end up:

### branch1 onto branch2
* Add newFile
* Conflict baseFile

### branch1 onto master
* Add newFile
* Modify baseFile

### branch2 onto master
* Modify baseFile
