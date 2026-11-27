#import "Contacts.h"
#import <Contacts/Contacts.h>

namespace {
NSArray<id<CNKeyDescriptor>> *keys() {
  return @[CNContactIdentifierKey, CNContactGivenNameKey, CNContactMiddleNameKey, CNContactFamilyNameKey,
    CNContactOrganizationNameKey, CNContactJobTitleKey, CNContactPhoneNumbersKey, CNContactEmailAddressesKey];
}

std::string json(id value) {
  NSData *bytes = [NSJSONSerialization dataWithJSONObject:value options:NSJSONWritingFragmentsAllowed error:nil];
  return bytes ? std::string(static_cast<const char *>(bytes.bytes), bytes.length) : "null";
}

NSString *nativeLabel(NSString *label) {
  if ([label isEqual:@"home"]) return CNLabelHome;
  if ([label isEqual:@"work"]) return CNLabelWork;
  if ([label isEqual:@"mobile"]) return CNLabelPhoneNumberMobile;
  if ([label isEqual:@"other"]) return CNLabelOther;
  return label;
}

NSString *labelName(NSString *label) {
  if ([label isEqual:CNLabelHome]) return @"home";
  if ([label isEqual:CNLabelWork]) return @"work";
  if ([label isEqual:CNLabelPhoneNumberMobile]) return @"mobile";
  if ([label isEqual:CNLabelOther]) return @"other";
  return label;
}

NSDictionary *row(CNContact *contact) {
  NSMutableArray *phones = [NSMutableArray new];
  for (CNLabeledValue<CNPhoneNumber *> *phone in contact.phoneNumbers) {
    NSMutableDictionary *entry = [@{@"number": phone.value.stringValue} mutableCopy];
    entry[@"label"] = labelName(phone.label);
    [phones addObject:entry];
  }
  NSMutableArray *emails = [NSMutableArray new];
  for (CNLabeledValue<NSString *> *email in contact.emailAddresses) {
    NSMutableDictionary *entry = [@{@"email": email.value} mutableCopy];
    entry[@"label"] = labelName(email.label);
    [emails addObject:entry];
  }
  NSMutableDictionary *result = [@{@"id": contact.identifier, @"phones": phones, @"emails": emails} mutableCopy];
  [@{@"givenName": contact.givenName, @"middleName": contact.middleName, @"familyName": contact.familyName,
     @"company": contact.organizationName, @"jobTitle": contact.jobTitle} enumerateKeysAndObjectsUsingBlock:
      ^(NSString *key, NSString *value, BOOL *) { if (value.length) result[key] = value; }];
  return result;
}

NSString *text(id value) { return value == NSNull.null ? @"" : value; }

void patch(CNMutableContact *contact, NSDictionary *fields) {
  if (fields[@"givenName"]) contact.givenName = text(fields[@"givenName"]);
  if (fields[@"middleName"]) contact.middleName = text(fields[@"middleName"]);
  if (fields[@"familyName"]) contact.familyName = text(fields[@"familyName"]);
  if (fields[@"company"]) contact.organizationName = text(fields[@"company"]);
  if (fields[@"jobTitle"]) contact.jobTitle = text(fields[@"jobTitle"]);
  if (fields[@"phones"]) {
    NSMutableArray *phones = [NSMutableArray new];
    for (NSDictionary *phone in fields[@"phones"]) {
      [phones addObject:[CNLabeledValue labeledValueWithLabel:nativeLabel(phone[@"label"])
        value:[CNPhoneNumber phoneNumberWithStringValue:phone[@"number"]]]];
    }
    contact.phoneNumbers = phones;
  }
  if (fields[@"emails"]) {
    NSMutableArray *emails = [NSMutableArray new];
    for (NSDictionary *email in fields[@"emails"]) {
      [emails addObject:[CNLabeledValue labeledValueWithLabel:nativeLabel(email[@"label"]) value:email[@"email"]]];
    }
    contact.emailAddresses = emails;
  }
}

bool canRead() {
  const auto status = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
  if (status == CNAuthorizationStatusAuthorized) return true;
  if (@available(iOS 18.0, *)) return status == CNAuthorizationStatusLimited;
  return false;
}

void perform(NSDictionary *command, nayan::AppCompletion completed) {
  NSString *action = command[@"action"];
  NSString *usage = [NSBundle.mainBundle objectForInfoDictionaryKey:@"NSContactsUsageDescription"];
  if ([action isEqual:@"contacts.available"]) { completed(usage.length ? "true" : "false", {}); return; }
  if (!usage.length || !canRead()) { completed({}, "Contacts access has not been granted"); return; }

  CNContactStore *store = [CNContactStore new];
  NSError *error = nil;
  if ([action isEqual:@"contacts.list"]) {
    auto request = [[CNContactFetchRequest alloc] initWithKeysToFetch:keys()];
    NSMutableArray *contacts = [NSMutableArray new];
    if (![store enumerateContactsWithFetchRequest:request error:&error usingBlock:
        ^(CNContact *contact, BOOL *) { [contacts addObject:row(contact)]; }]) {
      completed({}, "Could not read contacts"); return;
    }
    completed(nayan::contactsPage(json(command[@"options"]), json(contacts)), {});
    return;
  }

  BOOL create = [action isEqual:@"contacts.create"];
  BOOL remove = [action isEqual:@"contacts.remove"];
  CNContact *current = create ? nil : [store unifiedContactWithIdentifier:command[@"id"] keysToFetch:keys() error:&error];
  if (!create && !current) {
    if (error && !([error.domain isEqual:CNErrorDomain] && error.code == CNErrorCodeRecordDoesNotExist)) {
      completed({}, "Could not read the contact"); return;
    }
    completed(remove ? "false" : "null", {});
    return;
  }
  if ([action isEqual:@"contacts.get"]) { completed(json(row(current)), {}); return; }

  CNMutableContact *contact = create ? [CNMutableContact new] : [current mutableCopy];
  CNSaveRequest *save = [CNSaveRequest new];
  if (remove) {
    [save deleteContact:contact];
  } else {
    patch(contact, command[@"fields"]);
    if (create) [save addContact:contact toContainerWithIdentifier:nil];
    else [save updateContact:contact];
  }
  if (![store executeSaveRequest:save error:&error]) { completed({}, "Could not save the contact change"); return; }
  completed(remove ? "true" : json(row(contact)), {});
}
} // namespace

namespace nayan {
void requestContacts(NSDictionary *command, AppCompletion completed) {
  static dispatch_queue_t queue = dispatch_queue_create("com.nayanui.contacts", DISPATCH_QUEUE_SERIAL);
  dispatch_async(queue, ^{
    @autoreleasepool {
      @try { perform(command, completed); }
      @catch (NSException *) { completed({}, "Contacts request failed"); }
    }
  });
}
}
