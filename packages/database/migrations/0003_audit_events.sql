-- Append-only operational audit. This is not a financial journal.
-- The runtime role may insert a new event and read events.
-- It cannot update, delete, or truncate prior events, and it cannot change schema.

CREATE TABLE app.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL,
  action text NOT NULL,
  subject text NOT NULL,
  request_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION app.reject_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit events are append-only'
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION app.reject_audit_mutation() FROM PUBLIC;

CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON app.audit_events
  FOR EACH ROW
  EXECUTE FUNCTION app.reject_audit_mutation();

CREATE TRIGGER audit_events_no_truncate
  BEFORE TRUNCATE ON app.audit_events
  FOR EACH STATEMENT
  EXECUTE FUNCTION app.reject_audit_mutation();

REVOKE ALL ON TABLE app.audit_events FROM PUBLIC;
GRANT SELECT, INSERT ON TABLE app.audit_events TO perkly_runtime;
GRANT USAGE, SELECT ON SEQUENCE app.audit_events_id_seq TO perkly_runtime;
