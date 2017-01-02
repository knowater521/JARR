"""Shared constants."""

MIMETYPES = (('application/atom+xml', 1), ('application/rss+xml', 0.9),
             ('application/rdf+xml', 0.8), ('application/xml', 0.5),
             ('text/xml', 0.5), ('*/*', 0.2))

FEED_ACCEPT_HEADERS = ','.join(mtype + (';q=%0.1f' % qual if qual < 1 else '')
                               for mtype, qual in MIMETYPES)
FEED_MIMETYPES = [mtype for mtype, quality in MIMETYPES if quality >= 0.5]