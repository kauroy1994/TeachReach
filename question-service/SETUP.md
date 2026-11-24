# Office-hours questions

The **Ask a question** tab in each released CS 483/583 module embeds the same [Google Form](https://docs.google.com/forms/d/e/1FAIpQLSdwjuFTk3H_5CCgNvy9NUylOrx1xhQ9ri7PaIKw8rAAf7P-Pw/viewform). Each page preselects its module and includes a link to open the form in a new tab.

Google Forms records the timestamp, module, question and responder-entered email address on its linked response tab in the [faculty spreadsheet](https://docs.google.com/spreadsheets/d/1i5se-ApkNFNxh1cRSx7oI1DN8K65RaNbPb2ohesbLZI/edit). Filter by module while reviewing questions. Add completed answers to the corresponding module FAQ. Students see the form and their submission confirmation. Form settings keep the response summary off.

To add a module, add its name to the form’s Module dropdown and use Google Forms’ **Pre-fill form** command to get the link for that choice. Use that link for the new-tab action and add the URL parameter `embedded=true` for the iframe. Edit the existing form to keep its response destination and the current module links.

The former Apps Script queue in this directory is historical. The published module pages submit directly through Google Forms.

CS 691 uses a separate Google Form and response spreadsheet under the course owner’s account. The form receives the module, question and optional reply address. The student pages receive only the public form URL. To update a CS 691 FAQ, edit the relevant module’s FAQ in its stage JSON, then run `python3 scripts/build_neurosymbolic.py` and `python3 scripts/check_curriculum.py`.
