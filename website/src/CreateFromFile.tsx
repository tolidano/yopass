import * as React from 'react';
import { useState } from 'react';
import {
  Alert,
  Button,
  Form,
  FormGroup,
  FormText,
  Input,
  Label,
} from 'reactstrap';
import * as sjcl from 'sjcl';
import Result from './Result';

const createFromFile = () => {
  const [expiration, setExpiration] = useState('3600');
  const [error, setError] = useState('');
  const [secretFile, setSecretFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [uuid, setUUID] = useState('');
  const [password, setPassword] = useState('');
  const BACKEND_DOMAIN = process.env.REACT_APP_BACKEND_URL
    ? `${process.env.REACT_APP_BACKEND_URL}/secret`
    : '/secret';

  const submit = async () => {
    if (secretFile === '') {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const pw = randomString();
      const fileData = await fetch(secretFile);
      const bytes = new Uint8Array(fileData.arrayBuffer());
      const bits = toBitArrayCodec(bytes);
      const base64bits = sjcl.codec.base64.fromBits(bits);
      const encryptedFile = sjcl.encrypt(pw, base64bits);
      const request = await fetch(BACKEND_DOMAIN, {
        body: JSON.stringify({
          expiration: parseInt(expiration, 10),
          secret: encryptedFile,
        }),
        method: 'POST',
      });
      const data = await request.json();
      if (request.status !== 200) {
        setError(data.message);
      } else {
        setUUID(data.message);
        setPassword(pw);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Encrypt file</h1>
      <Error message={error} onClick={() => setError('')} />
      {uuid ? (
        <Result uuid={uuid} password={password} />
      ) : (
        <Form>
          <FormGroup>
            <Label>Secret file</Label>
            <Input
              type="file"
              name="secretFile"
              placeholder="File to encrypt locally in your browser"
              onChange={e => setSecretFile(e.target.value)}
              value={secretFile}
            />
          </FormGroup>
          <FormGroup tag="fieldset">
            <Label>Lifetime</Label>
            <FormText color="muted">
              The encrypted message will be deleted automatically after
            </FormText>
            <FormGroup check={true}>
              <Label check={true}>
                <Input
                  type="radio"
                  name="1h"
                  value="3600"
                  onChange={e => setExpiration(e.target.value)}
                  checked={expiration === '3600'}
                />
                One Hour
              </Label>
            </FormGroup>
            <FormGroup check={true}>
              <Label check={true}>
                <Input
                  type="radio"
                  name="1d"
                  value="86400"
                  onChange={e => setExpiration(e.target.value)}
                  checked={expiration === '86400'}
                />
                One Day
              </Label>
            </FormGroup>
            <FormGroup check={true} disabled={true}>
              <Label check={true}>
                <Input
                  type="radio"
                  name="1w"
                  value="604800"
                  onChange={e => setExpiration(e.target.value)}
                  checked={expiration === '604800'}
                />
                One Week
              </Label>
            </FormGroup>
          </FormGroup>
          <Button
            disabled={loading}
            color="primary"
            size="lg"
            block={true}
            onClick={() => submit()}
          >
            {loading ? (
              <span>Encrypting file...</span>
            ) : (
              <span>Encrypt File</span>
            )}
          </Button>
        </Form>
      )}
    </div>
  );
};

const Error = (
  props: { readonly message: string } & React.HTMLAttributes<HTMLElement>,
) =>
  props.message ? (
    <Alert color="danger" {...props}>
      {props.message}
    </Alert>
  ) : null;

const toBitArrayCodec = (bytes): Array => {
    var out = [], i, tmp=0;
    for (i=0; i<bytes.length; i++) {
        tmp = tmp << 8 | bytes[i];
        if ((i&3) === 3) {
            out.push(tmp);
            tmp = 0;
        }
    }
    if (i&3) {
        out.push(sjcl.bitArray.partial(8*(i&3), tmp));
    }
    return out;
};

const randomString = (): string => {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 22; i++) {
    text += possible.charAt(randomInt(0, possible.length));
  }
  return text;
};

const randomInt = (min: number, max: number): number => {
  const byteArray = new Uint8Array(1);
  window.crypto.getRandomValues(byteArray);

  const range = max - min;
  const maxRange = 256;
  if (byteArray[0] >= Math.floor(maxRange / range) * range) {
    return randomInt(min, max);
  }
  return min + (byteArray[0] % range);
};

export default createFromFile;
