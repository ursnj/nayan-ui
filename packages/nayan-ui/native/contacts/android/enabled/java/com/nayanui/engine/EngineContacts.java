package com.nayanui.engine;

import android.Manifest;
import android.content.ContentProviderOperation;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import android.provider.ContactsContract.CommonDataKinds.Email;
import android.provider.ContactsContract.CommonDataKinds.Organization;
import android.provider.ContactsContract.CommonDataKinds.Phone;
import android.provider.ContactsContract.CommonDataKinds.StructuredName;
import android.provider.ContactsContract.Contacts;
import android.provider.ContactsContract.Data;
import android.provider.ContactsContract.RawContacts;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.BiConsumer;
import org.json.JSONArray;
import org.json.JSONObject;

final class EngineContacts {
  private static final ExecutorService worker = Executors.newSingleThreadExecutor();
  private static final String TYPES = Data.MIMETYPE + " IN (?,?,?,?)";
  private static final String[] MIMES = {StructuredName.CONTENT_ITEM_TYPE, Organization.CONTENT_ITEM_TYPE,
      Phone.CONTENT_ITEM_TYPE, Email.CONTENT_ITEM_TYPE};

  static void request(Context context, JSONObject command, BiConsumer<String, String> complete, BiConsumer<String, String> listed) {
    worker.execute(() -> {
      try {
        String action = command.getString("action");
        if (action.equals("contacts.available")) {
          String[] declared = context.getPackageManager().getPackageInfo(context.getPackageName(), PackageManager.GET_PERMISSIONS).requestedPermissions;
          complete.accept(Boolean.toString(declared != null && Arrays.asList(declared).contains(Manifest.permission.READ_CONTACTS)), "");
          return;
        }
        if (context.checkSelfPermission(Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
          complete.accept("", "Contacts read access has not been granted");
          return;
        }
        ContentResolver resolver = context.getContentResolver();
        if (action.equals("contacts.list")) {
          listed.accept(command.getJSONObject("options").toString(), new JSONArray(rows(context, null, null).values()).toString());
          return;
        }

        boolean create = action.equals("contacts.create");
        boolean remove = action.equals("contacts.remove");
        Uri contact = create ? null : lookup(resolver, command.getString("id"));
        if (!create && contact == null) { complete.accept(remove ? "false" : "null", ""); return; }
        if (action.equals("contacts.get")) {
          JSONObject entry = row(context, contact);
          complete.accept(entry == null ? "null" : entry.toString(), "");
          return;
        }
        if (context.checkSelfPermission(Manifest.permission.WRITE_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
          complete.accept("", "Contacts write access has not been granted");
          return;
        }
        if (remove) {
          long rawId = writableRawContact(resolver, ContentUris.parseId(contact));
          Uri rawContact = ContentUris.withAppendedId(RawContacts.CONTENT_URI, rawId);
          complete.accept(Boolean.toString(resolver.delete(rawContact, null, null) == 1), "");
          return;
        }
        JSONObject result = save(context, contact, command.getJSONObject("fields"));
        complete.accept(result == null ? "null" : result.toString(), "");
      } catch (ContactWriteException error) {
        complete.accept("", error.getMessage());
      } catch (Exception error) {
        // Provider exceptions can embed contact values or query details.
        complete.accept("", "Could not complete the contacts operation");
      }
    });
  }

  private static final class ContactWriteException extends RuntimeException {
    ContactWriteException(String message) { super(message); }
  }

  private static Uri lookup(ContentResolver resolver, String id) {
    int separator = id.indexOf(':');
    if (separator < 1 || separator == id.length() - 1) return null;
    try {
      long contactId = Long.parseLong(id.substring(0, separator));
      return Contacts.lookupContact(resolver, Contacts.getLookupUri(contactId, id.substring(separator + 1)));
    } catch (NumberFormatException error) {
      return null;
    }
  }

  private static JSONObject row(Context context, Uri contact) throws Exception {
    long id = ContentUris.parseId(contact);
    return rows(context, Contacts._ID + "=?", Long.toString(id)).get(id);
  }

  private static LinkedHashMap<Long, JSONObject> rows(Context context, String selection, String id) throws Exception {
    ContentResolver resolver = context.getContentResolver();
    LinkedHashMap<Long, JSONObject> contacts = new LinkedHashMap<>();
    try (Cursor cursor = resolver.query(Contacts.CONTENT_URI, new String[]{Contacts._ID, Contacts.LOOKUP_KEY},
        selection, id == null ? null : new String[]{id}, null)) {
      if (cursor == null) throw new IllegalStateException();
      while (cursor.moveToNext()) {
        long key = cursor.getLong(0);
        JSONObject contact = new JSONObject().put("id", key + ":" + cursor.getString(1))
            .put("phones", new JSONArray()).put("emails", new JSONArray());
        contacts.put(key, contact);
      }
    }
    if (contacts.isEmpty()) return contacts;
    String condition = id == null ? TYPES : TYPES + " AND " + Data.CONTACT_ID + "=?";
    String[] args = id == null ? MIMES : new String[]{MIMES[0], MIMES[1], MIMES[2], MIMES[3], id};
    try (Cursor cursor = resolver.query(Data.CONTENT_URI,
        new String[]{Data.CONTACT_ID, Data.MIMETYPE, Data.DATA1, Data.DATA2, Data.DATA3, Data.DATA4, Data.DATA5},
        condition, args, Data.IS_SUPER_PRIMARY + " DESC, " + Data.IS_PRIMARY + " DESC, " + Data._ID)) {
      if (cursor == null) throw new IllegalStateException();
      while (cursor.moveToNext()) {
        JSONObject contact = contacts.get(cursor.getLong(0));
        if (contact == null) continue;
        switch (cursor.getString(1)) {
          case StructuredName.CONTENT_ITEM_TYPE -> {
            putText(contact, "givenName", cursor.getString(3));
            putText(contact, "familyName", cursor.getString(4));
            putText(contact, "middleName", cursor.getString(6));
          }
          case Organization.CONTENT_ITEM_TYPE -> {
            putText(contact, "company", cursor.getString(2));
            putText(contact, "jobTitle", cursor.getString(5));
          }
          case Phone.CONTENT_ITEM_TYPE, Email.CONTENT_ITEM_TYPE -> {
            boolean phone = cursor.getString(1).equals(Phone.CONTENT_ITEM_TYPE);
            String address = cursor.getString(2);
            if (address == null || address.isEmpty()) continue;
            JSONObject value = new JSONObject().put(phone ? "number" : "email", address);
            value.put("label", label(context, phone, cursor.getInt(3), cursor.getString(4)));
            contact.getJSONArray(phone ? "phones" : "emails").put(value);
          }
        }
      }
    }
    return contacts;
  }

  private static void putText(JSONObject contact, String name, String value) throws Exception {
    if (!contact.has(name) && value != null && !value.isEmpty()) contact.put(name, value);
  }

  private static String label(Context context, boolean phone, int type, String custom) {
    if (type == 0) return custom;
    if (type == (phone ? Phone.TYPE_HOME : Email.TYPE_HOME)) return "home";
    if (type == (phone ? Phone.TYPE_WORK : Email.TYPE_WORK)) return "work";
    if (type == (phone ? Phone.TYPE_MOBILE : Email.TYPE_MOBILE)) return "mobile";
    if (type == (phone ? Phone.TYPE_OTHER : Email.TYPE_OTHER)) return "other";
    return (phone ? Phone.getTypeLabel(context.getResources(), type, custom) : Email.getTypeLabel(context.getResources(), type, custom)).toString();
  }

  private static long writableRawContact(ContentResolver resolver, long contactId) {
    try (Cursor cursor = resolver.query(RawContacts.CONTENT_URI, new String[]{RawContacts._ID, RawContacts.RAW_CONTACT_IS_READ_ONLY},
        RawContacts.CONTACT_ID + "=? AND " + RawContacts.DELETED + "=0", new String[]{Long.toString(contactId)}, null)) {
      if (cursor == null || !cursor.moveToFirst()) throw new IllegalStateException();
      long rawId = cursor.getLong(0);
      if (cursor.getInt(1) != 0) throw new ContactWriteException("This contact is read-only");
      if (cursor.moveToNext()) throw new ContactWriteException("Edit linked Android contacts in the device Contacts app");
      return rawId;
    }
  }

  private static JSONObject save(Context context, Uri contact, JSONObject fields) throws Exception {
    ContentResolver resolver = context.getContentResolver();
    long rawId = contact == null ? -1 : writableRawContact(resolver, ContentUris.parseId(contact));
    ArrayList<ContentProviderOperation> ops = new ArrayList<>();
    if (contact == null) {
      ops.add(ContentProviderOperation.newInsert(RawContacts.CONTENT_URI)
          .withValue(RawContacts.ACCOUNT_NAME, null).withValue(RawContacts.ACCOUNT_TYPE, null).build());
    }
    patchText(resolver, ops, rawId, fields, StructuredName.CONTENT_ITEM_TYPE,
        new String[]{"givenName", "middleName", "familyName"}, new String[]{StructuredName.GIVEN_NAME, StructuredName.MIDDLE_NAME, StructuredName.FAMILY_NAME});
    patchText(resolver, ops, rawId, fields, Organization.CONTENT_ITEM_TYPE,
        new String[]{"company", "jobTitle"}, new String[]{Organization.COMPANY, Organization.TITLE});
    patchValues(ops, rawId, fields.optJSONArray("phones"), true);
    patchValues(ops, rawId, fields.optJSONArray("emails"), false);
    if (!ops.isEmpty()) {
      var result = resolver.applyBatch(ContactsContract.AUTHORITY, ops);
      if (contact == null) {
        Uri lookupUri = RawContacts.getContactLookupUri(resolver, result[0].uri);
        contact = lookupUri == null ? null : Contacts.lookupContact(resolver, lookupUri);
      }
    }
    if (contact == null) throw new IllegalStateException();
    JSONObject entry = row(context, contact);
    if (entry == null) throw new IllegalStateException();
    return entry;
  }

  private static ContentProviderOperation.Builder insert(long rawId, String mime) {
    var operation = ContentProviderOperation.newInsert(Data.CONTENT_URI).withValue(Data.MIMETYPE, mime);
    return rawId == -1 ? operation.withValueBackReference(Data.RAW_CONTACT_ID, 0) : operation.withValue(Data.RAW_CONTACT_ID, rawId);
  }

  private static void patchText(ContentResolver resolver, ArrayList<ContentProviderOperation> ops, long rawId, JSONObject fields,
      String mime, String[] keys, String[] columns) throws Exception {
    if (Arrays.stream(keys).noneMatch(fields::has)) return;
    long existing = -1;
    if (rawId != -1) {
      try (Cursor cursor = resolver.query(Data.CONTENT_URI, new String[]{Data._ID}, Data.RAW_CONTACT_ID + "=? AND " + Data.MIMETYPE + "=?",
          new String[]{Long.toString(rawId), mime}, Data.IS_SUPER_PRIMARY + " DESC, " + Data.IS_PRIMARY + " DESC, " + Data._ID)) {
        if (cursor == null) throw new IllegalStateException();
        if (cursor.moveToFirst()) existing = cursor.getLong(0);
      }
    }
    if (existing == -1 && Arrays.stream(keys).noneMatch(key -> !fields.isNull(key))) return;
    var operation = existing == -1 ? insert(rawId, mime) :
        ContentProviderOperation.newUpdate(ContentUris.withAppendedId(Data.CONTENT_URI, existing)).withExpectedCount(1);
    for (int i = 0; i < keys.length; i++) {
      if (fields.has(keys[i])) operation.withValue(columns[i], fields.isNull(keys[i]) ? null : fields.getString(keys[i]));
    }
    ops.add(operation.build());
  }

  private static void patchValues(ArrayList<ContentProviderOperation> ops, long rawId, JSONArray values, boolean phone) throws Exception {
    if (values == null) return;
    String mime = phone ? Phone.CONTENT_ITEM_TYPE : Email.CONTENT_ITEM_TYPE;
    if (rawId != -1) {
      ops.add(ContentProviderOperation.newDelete(Data.CONTENT_URI)
          .withSelection(Data.RAW_CONTACT_ID + "=? AND " + Data.MIMETYPE + "=?", new String[]{Long.toString(rawId), mime}).build());
    }
    for (int i = 0; i < values.length(); i++) {
      JSONObject value = values.getJSONObject(i);
      String label = value.optString("label");
      int type = switch (label) {
        case "home" -> phone ? Phone.TYPE_HOME : Email.TYPE_HOME;
        case "work" -> phone ? Phone.TYPE_WORK : Email.TYPE_WORK;
        case "mobile" -> phone ? Phone.TYPE_MOBILE : Email.TYPE_MOBILE;
        case "other", "" -> phone ? Phone.TYPE_OTHER : Email.TYPE_OTHER;
        default -> 0;
      };
      var entry = insert(rawId, mime).withValue(Data.DATA1, value.getString(phone ? "number" : "email")).withValue(Data.DATA2, type);
      if (type == 0) entry.withValue(Data.DATA3, label);
      ops.add(entry.build());
    }
  }
}
