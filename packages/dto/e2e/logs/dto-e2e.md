# DTO E2E Log

Generated: 2026-05-19T16:30:57.481Z

## Summary

| Step | Title | Verdict |
| --- | --- | --- |
| 00 | Boot app and start REST server | Passed |
| 01 | ValidateBody success | Passed |
| 02 | ValidateBody failure | Expected failure |
| 03 | AdaptBody success | Passed |
| 04 | AdaptBody failure | Expected failure |
| 05 | createDtoSafe endpoint | Passed |
| 06 | DTO metadata and schema | Passed |
| 07 | Dispose app | Passed |

**Global verdict:** passed

## 00 - Boot app and start REST server

```json
{
  "baseUrl": "http://localhost:10032",
  "status": "ready"
}
```

## 01 - ValidateBody success

```json
{
  "request": {
    "name": "Alice",
    "age": 30
  },
  "responseStatus": 201,
  "responseData": {
    "name": "Alice",
    "age": 30
  },
  "hasError": false,
  "hookTypes": [
    "validate:onValidateStart",
    "validate:onValidateSuccess"
  ]
}
```

## 02 - ValidateBody failure

```json
{
  "request": {
    "name": "Alice",
    "age": "invalid"
  },
  "responseStatus": 400,
  "errorMessage": "400: Bad Request",
  "hookTypes": []
}
```

## 03 - AdaptBody success

```json
{
  "request": {
    "firstName": "John",
    "lastName": "Doe",
    "age": 28
  },
  "responseStatus": 201,
  "responseData": {
    "fullName": "John Doe",
    "age": 28
  },
  "hasError": false,
  "hookTypes": [
    "adapt:onAdaptStart",
    "adapt:onValidateStart",
    "adapt:onValidateSuccess",
    "adapt:onValidateStart",
    "adapt:onValidateSuccess",
    "adapt:onAdaptSuccess"
  ]
}
```

## 04 - AdaptBody failure

```json
{
  "request": {
    "firstName": "John",
    "age": 28
  },
  "responseStatus": 400,
  "errorMessage": "400: Bad Request",
  "hookTypes": []
}
```

## 05 - createDtoSafe endpoint

```json
{
  "okRequest": {
    "name": "Safe",
    "age": 44
  },
  "okStatus": 201,
  "okBody": {
    "ok": true,
    "data": {
      "name": "Safe",
      "age": 44
    }
  },
  "koRequest": {
    "name": "Safe",
    "age": "x"
  },
  "koStatus": 201,
  "koBody": {
    "ok": false,
    "error": {
      "name": "DtoValidationError",
      "status": 400
    },
    "issues": [
      {
        "path": "age",
        "code": "isInt",
        "message": "age must be an integer number",
        "value": "x"
      }
    ]
  }
}
```

## 06 - DTO metadata and schema

```json
{
  "metadataStatus": 200,
  "metadataBody": {
    "isCreateUserDto": true,
    "isExternalCreateUserDto": true
  },
  "schemaStatus": 200,
  "schemaBody": {
    "type": "object",
    "properties": {
      "name": {},
      "age": {}
    },
    "required": [
      "name",
      "age"
    ]
  }
}
```

## 07 - Dispose app

```json
{
  "status": "disposed"
}
```
