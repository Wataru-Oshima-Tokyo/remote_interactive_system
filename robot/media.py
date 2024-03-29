import json
import time

from util import request


class Media:
    """MediaStreamを利用する

    MediaConnectionオブジェクトと転送するメディアの送受信方法について指定
    """

    @classmethod
    def create_media(cls, is_video=True):
        """Mediaの待受ポート開放要求を送信

        ----------
        :param is_video: MediaがVideoか指定(falseはAudio)
        :return: media_id, ip_v4, port
        """

        params = {
            "is_video": is_video
        }

        res = request("post", "/media", json.dumps(params))

        if res.status_code == 201:
            json_text = json.loads(res.text)
            media_id = json_text["media_id"]
            ip_v4 = json_text["ip_v4"]
            port = json_text["port"]

            return media_id, ip_v4, port

        else:
            print('Failed creating media port: ', res)
            exit()

    @classmethod
    def answer(cls, media_connection_id, video_id):
        """callに応答する

        callにどのように応答するかMediaConstraintsを提供する。

        ----------
        :param media_connection_id:MediaConnection特定のid
        :param video_id:メディアid
        :return:レスポンスのオブジェクト
        """

        constraints = {
            "video": True,
            "videoReceiveEnabled": False,
            "audio": True,
            "audioReceiveEnabled": True,
            "video_params": {
                "band_width": 1500,
                "codec": "VP8",
                "media_id": video_id,
                "payload_type": 96,
            }
        }
        params = {
            "constraints": constraints,
            "redirect_params": {}  # 相手からビデオを受け取らない
        }
        res = request("post", "/media/connections/{}/answer".format(
            media_connection_id), json.dumps(params))
        if res.status_code == 202:
            return json.loads(res.text)

        else:
            print('failed answer: ', res.status_code)
            print(json.loads(res.text))
            exit()

    @classmethod
    def listen_media_event(cls, queue, media_connection_id):
        """MediaConnectionオブジェクトのイベントを待ち受ける
        """

        uri = "/media/connections/{}/events".format(media_connection_id)
        while True:
            _res = request('get', uri)
            res = json.loads(_res.text)

            if 'event' in res.keys():
                queue.put({'media_event': res['event']})

                if res['event'] in ['CLOSE', 'ERROR']:
                    break

            else:
                # print('No media_connection event')
                pass

            time.sleep(1)

    @classmethod
    def close_media_connections(cls, media_connection_id):
        """MediaConnectionを解放する

        ----------
        :param media_connection_id: MediaConnectionを特定するためのID
        :return: bool
        """

        res = request("delete", "/media/connections/{}".format(media_connection_id))
        if res.status_code == 204:
            print('release mediaConnection')
            return True
        else:
            print('failed closing mediaConnection: ', res)
            return False