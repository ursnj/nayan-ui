#include "AppServices.h"
#ifndef NAYAN_ENGINE_PERMISSIONS
#define NAYAN_ENGINE_PERMISSIONS 1
#endif
#if NAYAN_ENGINE_PERMISSIONS
#include "permissions/ios/Permissions.h"
#endif
#ifndef NAYAN_ENGINE_LOCATION
#define NAYAN_ENGINE_LOCATION 1
#endif
#if NAYAN_ENGINE_LOCATION
#include "location/ios/Location.h"
#endif
#import <UIKit/UIKit.h>
#include "keep-awake/ios/KeepAwake.h"
#ifndef NAYAN_ENGINE_REVIEW
#define NAYAN_ENGINE_REVIEW 1
#endif
#if NAYAN_ENGINE_REVIEW
#include "review/ios/StoreReview.h"
#endif
#ifndef NAYAN_ENGINE_IMAGE_PICKER
#define NAYAN_ENGINE_IMAGE_PICKER 0
#endif
#if NAYAN_ENGINE_IMAGE_PICKER
#include "image-picker/ios/ImagePicker.h"
#endif
#ifndef NAYAN_ENGINE_DOCUMENT_PICKER
#define NAYAN_ENGINE_DOCUMENT_PICKER 1
#endif
#if NAYAN_ENGINE_DOCUMENT_PICKER
#include "document-picker/ios/DocumentPicker.h"
#endif
#ifndef NAYAN_ENGINE_CONTACTS
#define NAYAN_ENGINE_CONTACTS 1
#endif
#if NAYAN_ENGINE_CONTACTS
#include "contacts/ios/Contacts.h"
#endif

namespace {
#if NAYAN_ENGINE_IMAGE_PICKER || NAYAN_ENGINE_REVIEW || NAYAN_ENGINE_DOCUMENT_PICKER
UIWindowScene *scene(){for(UIScene *scene in UIApplication.sharedApplication.connectedScenes)if(scene.activationState==UISceneActivationStateForegroundActive&&[scene isKindOfClass:UIWindowScene.class])return (UIWindowScene*)scene;return nil;}
#endif
std::string string(NSString *value){NSData *data=[value dataUsingEncoding:NSUTF8StringEncoding];return data.length?std::string((const char*)data.bytes,data.length):std::string{};}

}

namespace nayan {
bool hasImagePicker() { return NAYAN_ENGINE_IMAGE_PICKER == 1; }

#if NAYAN_ENGINE_IMAGE_PICKER
UIWindowScene *appServiceScene() { return scene(); }
#endif

void requestAppServices(std::string raw,AppCompletion completed){dispatch_async(dispatch_get_main_queue(),^{@try{
 observeKeepAwake();
 NSData *bytes=[NSData dataWithBytes:raw.data() length:raw.size()];NSDictionary *root=[NSJSONSerialization JSONObjectWithData:bytes options:0 error:nil];if(root[@"ok"]&&![root[@"ok"]boolValue]){completed({},string(root[@"error"]?:@"Invalid app service request"));return;}NSDictionary *value=root[@"value"]?:root;NSString *action=value[@"action"];
 if([action hasPrefix:@"awake."]||[action isEqual:@"cleanup"]){if(![action isEqual:@"awake.available"])setKeepAwake([value[@"active"]boolValue]);
#if NAYAN_ENGINE_IMAGE_PICKER
 if([action isEqual:@"cleanup"]) releaseImagePicker(value[@"owner"]);
#endif
#if NAYAN_ENGINE_LOCATION
 if([action isEqual:@"cleanup"]) releaseLocation(value[@"owner"]);
#endif
#if NAYAN_ENGINE_DOCUMENT_PICKER
 if([action isEqual:@"cleanup"]) cancelDocumentPicker(value[@"owner"]);
#endif
 completed([action isEqual:@"awake.available"]?"true":"null",{});return;}
#if NAYAN_ENGINE_REVIEW
 if([action isEqual:@"review.available"]){completed(scene()?"true":"false",{});return;}
 if([action isEqual:@"review.request"]){requestStoreReview(scene(), completed);return;}
#endif
#if NAYAN_ENGINE_LOCATION
 if ([action hasPrefix:@"location."]) {
   requestLocation(value, completed);
   return;
 }
#endif
#if NAYAN_ENGINE_CONTACTS
 if ([action hasPrefix:@"contacts."]) {
   requestContacts(value, completed);
   return;
 }
#endif
 if ([action hasPrefix:@"permissions."]) {
#if NAYAN_ENGINE_PERMISSIONS
   requestPermission(value, completed);
#else
   completed({}, "Permissions were disabled in this engine build");
#endif
   return;
 }
 if ([action hasPrefix:@"image."]) {
#if NAYAN_ENGINE_IMAGE_PICKER
   requestImagePicker(value, completed);
#else
   completed({}, "Engine image picker is disabled in this app build");
#endif
   return;
 }
#if NAYAN_ENGINE_DOCUMENT_PICKER
 if ([action hasPrefix:@"document."]) {
   requestDocumentPicker(scene(), value, completed);
   return;
 }
#endif
 completed({},"Unknown app service action");
 }@catch(NSException *error){completed({},string(error.reason?:@"App service request failed"));}});}
}
