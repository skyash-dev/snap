diesel::table! {
    snaps (id) {
        id -> Integer,
        title -> Text,
        content -> Text,
        content_type -> Text,
        tags -> Text[],
        last_edited -> Timestamp,
        created_at -> Timestamp,
    }
}
