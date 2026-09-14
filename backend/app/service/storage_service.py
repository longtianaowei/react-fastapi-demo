import os
from pathlib import Path
from urllib.parse import quote

import boto3
from dotenv import load_dotenv


load_dotenv()


class StorageService:
    def __init__(self):
        self.root = Path(__file__).resolve().parents[2] / "storage"
        self.root.mkdir(parents=True, exist_ok=True)

        self.bucket = os.getenv("S3_BUCKET")
        self.client = None

        if all(
            [
                os.getenv("S3_ENDPOINT"),
                self.bucket,
                os.getenv("S3_ACCESS_KEY"),
                os.getenv("S3_SECRET_KEY"),
            ]
        ):
            self.client = boto3.client(
                "s3",
                endpoint_url=os.getenv("S3_ENDPOINT"),
                aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
                aws_secret_access_key=os.getenv("S3_SECRET_KEY"),
                region_name=os.getenv("S3_REGION", "us-east-1"),
            )

    @property
    def use_object_storage(self):
        return self.client is not None

    def local_path(self, key: str):
        path = (self.root / key).resolve()

        if self.root.resolve() not in path.parents:
            raise ValueError("非法文件路径")

        return path

    def upload_file(self, path: Path, key: str, content_type: str | None = None):
        if self.use_object_storage:
            extra_args = {}
            if content_type:
                extra_args["ContentType"] = content_type

            self.client.upload_file(
                str(path),
                self.bucket,
                key,
                ExtraArgs=extra_args,
            )
            return key

        target = self.local_path(key)
        target.parent.mkdir(parents=True, exist_ok=True)
        path.replace(target)
        return key

    def download_url(self, key: str, filename: str):
        if not self.use_object_storage:
            return None

        return self.client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": self.bucket,
                "Key": key,
                "ResponseContentDisposition": (
                    f'attachment; filename="download"; '
                    f"filename*=UTF-8''{quote(filename)}"
                ),
            },
            ExpiresIn=600,
        )

    def delete_file(self, key: str):
        if self.use_object_storage:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return

        self.local_path(key).unlink(missing_ok=True)


storage_service = StorageService()
