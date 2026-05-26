# SPDX-License-Identifier: GPL-3.0-or-later
#
# Copyright (C) 2026 krrr
#

__version__ = "0.1.0"
DEFAULT_PORT = 41001


def get_server_config():
    from sqlmodel import Session, select
    from .db import init_db, engine
    from .models import SystemSettings

    init_db()
    with Session(engine) as session:
        settings = session.exec(select(SystemSettings).where(SystemSettings.id == 1)).first()
        if not settings:
            # Default values if no settings record exists yet
            return "127.0.0.1", DEFAULT_PORT

        # Use settings host if set, otherwise default to 127.0.0.1
        host = settings.get_value('host') or "127.0.0.1"
        port = settings.get_value('port')
        return host, port
