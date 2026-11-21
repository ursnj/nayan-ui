use std::ffi::c_void;

type Reply = extern "C" fn(*mut c_void, *const u8, usize);

#[cfg(feature = "sqlite")]
mod worker {
    use super::*;
    use crate::sqlite::{self, Session};
    use std::{
        collections::HashMap,
        sync::{
            OnceLock,
            mpsc::{self, Sender},
        },
    };

    pub enum Message {
        Request {
            owner: usize,
            bytes: Vec<u8>,
            context: usize,
            reply: Reply,
        },
        Release(usize),
    }

    pub static WORKER: OnceLock<Option<Sender<Message>>> = OnceLock::new();

    pub fn sender() -> Option<&'static Sender<Message>> {
        WORKER
            .get_or_init(|| {
                let (sender, receiver) = mpsc::channel();
                std::thread::Builder::new()
                    .name("nayan-sqlite".into())
                    .spawn(move || {
                        let mut sessions = HashMap::<usize, Session>::new();
                        while let Ok(message) = receiver.recv() {
                            match message {
                                Message::Request {
                                    owner,
                                    bytes,
                                    context,
                                    reply,
                                } => {
                                    let value = sqlite::parse(&bytes).and_then(|request| sessions.entry(owner).or_default().request(request));
                                    let response = sqlite::response(value);
                                    reply(context as *mut c_void, response.as_ptr(), response.len());
                                }
                                Message::Release(owner) => {
                                    sessions.remove(&owner);
                                }
                            }
                        }
                    })
                    .ok()?;
                Some(sender)
            })
            .as_ref()
    }
}

/// # Safety
/// data points to length readable bytes. On success reply runs once; its buffer is borrowed.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_sqlite_submit(owner: usize, data: *const u8, length: usize, context: *mut c_void, reply: Reply) -> u8 {
    #[cfg(feature = "sqlite")]
    {
        if data.is_null() || length > crate::sqlite::MAX_REQUEST {
            return 0;
        }
        let bytes = unsafe { std::slice::from_raw_parts(data, length) }.to_vec();
        worker::sender().is_some_and(|sender| {
            sender
                .send(worker::Message::Request {
                    owner,
                    bytes,
                    context: context as usize,
                    reply,
                })
                .is_ok()
        }) as u8
    }
    #[cfg(not(feature = "sqlite"))]
    {
        let _ = (owner, data, length, context, reply);
        0
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_sqlite_release(owner: usize) {
    #[cfg(feature = "sqlite")]
    if let Some(Some(sender)) = worker::WORKER.get() {
        let _ = sender.send(worker::Message::Release(owner));
    }
    #[cfg(not(feature = "sqlite"))]
    let _ = owner;
}
