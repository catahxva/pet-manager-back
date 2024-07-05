import { GenericError, ComplexError } from "../utils/CustomErrors.js";

// CONTROLLER FOR:
//              - CREATING A NEW DAY

// Notes: - Days should contain a reference to the user which
//      creats them => - for querying
//                     - if users deletes account, easy to delete
//                          all related data
//        - Days should contain a reference to the pet which
//          they are added to => - for querying
//                               - if pet is removed, easy to delete
//                                  all related data
//        - Days should contain a reference to the current
//          month => - for querying when implementing diet history
//                      feature
//        - Days should contain a reference to the current
//          year => - same reason as for the month ref

// function roles:
//  - extract data
//  - validate data
//  - check if exact day (d && m && y) already exists
//      for this pet
//  - create day doc if not
//  - check if exact month (m && y) already exists for
//      this pet
//  - create month doc if not
//  - check if exact year already exists for this pet
//  - create year doc if not
//  - send response
const createDay = async function (req, res) {};

const daysController = { createDay };

export default daysController;
